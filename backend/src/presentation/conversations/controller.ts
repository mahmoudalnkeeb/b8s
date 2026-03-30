import { NextFunction, Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createConversationDto, sendMessageDto } from './dto';
import { DIContainer } from '../../infrastructure/di/container';
import { UnauthorizedError, ValidationError } from '../../domain/errors';

export class ConversationController {
  public create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const dto = createConversationDto.parse(req.body);
      const conversation = await DIContainer.createConversation.execute({
        agentId: dto.agentId,
        userId,
      });
      DIContainer.logger.info('Conversation created via port', {
        conversationId: conversation.conversationId,
        userId,
      });
      return res.status(201).json(conversation);
    } catch (error) {
      return next(error);
    }
  };

  public listMyConversations = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const conversations = await DIContainer.listUserConversations.execute(userId);
      return res.status(200).json(conversations);
    } catch (error) {
      return next(error);
    }
  };

  public getById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const conversationId = req.params['conversationId'];
      if (!conversationId || typeof conversationId !== 'string')
        throw new ValidationError('Conversation ID is required', 'MISSING_CONVERSATION_ID');

      const conversation = await DIContainer.getConversationById.execute(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Extract citations from tools and map messages for the client
      const rawMessages = conversation.messages.filter((m) => m.role !== 'system');
      const clientMessages = [];
      let pendingCitations: any[] = [];

      for (const m of rawMessages) {
        if (m.role === 'tool') {
          const toolName = (m.metadata?.['toolName'] as string) || 'unknown_tool';
          clientMessages.push({
            role: 'tool',
            content: `Ran tool: ${toolName}`,
            toolName: toolName,
            timestamp: m.timestamp,
          });

          if (toolName === 'rag_query') {
            try {
              const result = JSON.parse(m.content);
              if (result.ok && result.context) {
                pendingCitations.push(...result.context.map((c: any) => c.citation));
              }
            } catch {
              // Ignore parse errors
            }
          }
        } else if (m.role === 'assistant' && (m.content === undefined || m.content.trim() !== '')) {
          clientMessages.push({
            role: m.role,
            content: m.content || '',
            timestamp: m.timestamp,
            citations: pendingCitations.length > 0 ? pendingCitations : undefined,
          });
          pendingCitations = []; // Clear applied citations
        } else if (m.role === 'user') {
          clientMessages.push({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          });
          pendingCitations = []; // Reset on new user message
        }
      }

      return res.status(200).json({
        ...conversation,
        messages: clientMessages,
      });
    } catch (error) {
      return next(error);
    }
  };

  public sendMessage = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const conversationId = req.params['conversationId'];
      if (!conversationId || typeof conversationId !== 'string')
        throw new ValidationError('Conversation ID is required', 'MISSING_CONVERSATION_ID');

      const dto = sendMessageDto.parse(req.body);

      DIContainer.logger.info('Message received via port', { conversationId, userId });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();

      // Track if client disconnected
      let clientDisconnected = false;
      req.on('close', () => {
        clientDisconnected = true;
        DIContainer.logger.info('Client disconnected from stream', { conversationId, userId });
      });

      try {
        const agentId = (req.body as Record<string, unknown>)['agentId'] as string | undefined;
        const stream = DIContainer.chatWithAgent.executeStream({
          conversationId: conversationId,
          userId: userId,
          userMessage: dto.content,
          agentId: agentId || '',
        });

        for await (const chunk of stream) {
          if (clientDisconnected) break;

          if (chunk.newMessages) {
            const citations: any[] = [];
            const toolEvents: any[] = [];

            for (const m of chunk.newMessages) {
              if (m.role === 'tool') {
                const toolName = (m.metadata?.['toolName'] as string) || 'unknown_tool';
                toolEvents.push({
                  role: 'tool',
                  toolName: toolName,
                  content: `Ran tool: ${toolName}`,
                  timestamp: m.timestamp,
                });

                if (toolName === 'rag_query') {
                  try {
                    const result = JSON.parse(m.content);
                    if (result.ok && result.context) {
                      citations.push(...result.context.map((c: any) => c.citation));
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
            }
            if (citations.length > 0) {
              res.write(`data: ${JSON.stringify({ citations })}\n\n`);
            }
            if (toolEvents.length > 0) {
              res.write(`data: ${JSON.stringify({ toolEvents })}\n\n`);
            }
          }

          if (chunk.content) {
            res.write(`data: ${JSON.stringify({ chunk: chunk.content })}\n\n`);
          }
        }
        DIContainer.logger.info('Assistant response completed via stream', {
          conversationId,
          userId,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        DIContainer.logger.error('Hexagonal Streaming Error', error);
        if (!clientDisconnected) {
          res.write(
            `data: ${JSON.stringify({
              error: message,
            })}\n\n`,
          );
        }
      } finally {
        if (!clientDisconnected) {
          res.write(`data: [DONE]\n\n`);
          res.end();
        }
      }
      return;
    } catch (error) {
      return next(error);
    }
  };

  public delete = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const conversationId = req.params['conversationId'];
      if (!conversationId || typeof conversationId !== 'string')
        throw new ValidationError('Conversation ID is required', 'MISSING_CONVERSATION_ID');

      const success = await DIContainer.deleteConversation.execute(conversationId, userId);
      if (!success) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      DIContainer.logger.info('Conversation deleted via port', { conversationId, userId });
      return res.status(200).json({ ok: true });
    } catch (error) {
      return next(error);
    }
  };
}
