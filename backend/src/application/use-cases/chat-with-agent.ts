import {
  IAgentRepository,
  IConversationRepository,
  ToolExecutionContext,
} from '../../domain/ports';
import { IBillingRepository } from '../../domain/ports/billing-repository';
import { AgentOrchestratorService } from '../services/agent-orchestrator';
import { IMessage, MessageRole } from '../../domain/models';
import {
  NotFoundError,
  UnauthorizedError,
  InsufficientBalanceError,
  ValidationError,
} from '../../domain/errors';
import { DomainToolService } from '../../domain/services/tool-service';
import { BASE_SYSTEM_PROMPT } from '../../domain/constants/prompts';
import { DeductCUsUseCase } from './deduct-cus';
import type { ILogger } from '../../domain/services/logger';

export interface ChatRequest {
  agentId: string;
  conversationId: string;
  userMessage: string;
  userId: string;
}

export class ChatWithAgentUseCase {
  constructor(
    private agentRepo: IAgentRepository,
    private convoRepo: IConversationRepository,
    private orchestrator: AgentOrchestratorService,
    private billingRepo: IBillingRepository,
    private deductCUs: DeductCUsUseCase,
    private logger: ILogger,
  ) {}

  private async checkBalance(userId: string): Promise<void> {
    const account = await this.billingRepo.findByUserId(userId);
    if (!account || account.tier === 'none') {
      throw new InsufficientBalanceError(
        'You need an active plan to chat with agents. Redeem a coupon or upgrade your plan.',
      );
    }
    const totalAvailable = account.cuBalance + account.grantedCuBalance;
    if (totalAvailable <= 0) {
      throw new InsufficientBalanceError();
    }
  }

  async execute(request: ChatRequest): Promise<string> {
    const agent = await this.agentRepo.findById(request.agentId);
    if (!agent) throw new NotFoundError('Agent not found', 'AGENT_NOT_FOUND');
    if (agent.ownerId !== request.userId)
      throw new UnauthorizedError('Unauthorized', 'UNAUTHORIZED');

    // Pre-check billing
    await this.checkBalance(request.userId);

    let conversation = await this.convoRepo.findById(request.conversationId);
    const isNew = !conversation;

    if (!conversation) {
      conversation = {
        conversationId: request.conversationId,
        agentId: request.agentId,
        userId: request.userId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (!request.userMessage || request.userMessage.trim() === '') {
      throw new Error('Message content cannot be empty');
    }

    const newUserMessage: IMessage = {
      role: MessageRole.USER,
      content: request.userMessage,
      timestamp: new Date(),
    };

    // Clone messages to avoid mutating caller's object
    const messages = [...conversation.messages, newUserMessage];

    const tools = DomainToolService.getEffectiveTools(agent);
    const context: ToolExecutionContext = {
      agentId: agent.agentId,
      userId: request.userId,
      conversationId: conversation.conversationId,
      lastUserMessage: request.userMessage,
    };

    const systemInstruction = BASE_SYSTEM_PROMPT + '\n' + (agent.config.instructions || '');

    const result = await this.orchestrator.run(messages, tools, systemInstruction, context);

    const allMessages = [...messages, ...result.newMessages];

    if (isNew) {
      await this.convoRepo.create({
        ...conversation,
        messages: allMessages,
      });
    } else {
      await this.convoRepo.update(conversation.conversationId, {
        messages: allMessages,
        updatedAt: new Date(),
      });
    }

    // Post-chat: deduct CUs based on token usage
    try {
      const usage = result.usage;
      if (usage) {
        await this.deductCUs.execute({
          userId: request.userId,
          agentId: request.agentId,
          conversationId: conversation.conversationId,
          inputTokens: usage.promptTokens || 0,
          outputTokens: usage.completionTokens || 0,
          cachedTokens: 0,
        });
      }
    } catch (error) {
      this.logger.error('Failed to deduct CUs after chat', {
        userId: request.userId,
        agentId: request.agentId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    return result.content;
  }

  async *executeStream(request: ChatRequest) {
    // Pre-check billing
    await this.checkBalance(request.userId);

    let conversation = await this.convoRepo.findById(request.conversationId);
    const isNew = !conversation;

    if (!conversation) {
      const agent = await this.agentRepo.findById(request.agentId);
      if (!agent) throw new NotFoundError('Agent not found', 'AGENT_NOT_FOUND');
      conversation = {
        conversationId: request.conversationId,
        agentId: request.agentId,
        userId: request.userId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    if (!request.userMessage || request.userMessage.trim() === '') {
      throw new ValidationError('Message content cannot be empty', 'EMPTY_MESSAGE');
    }

    const newUserMessage: IMessage = {
      role: MessageRole.USER,
      content: request.userMessage,
      timestamp: new Date(),
    };

    // Clone messages to avoid mutating caller's object
    const messages = [...conversation.messages, newUserMessage];

    if (isNew) {
      await this.convoRepo.create({
        ...conversation,
        messages,
      });
    } else {
      await this.convoRepo.update(conversation.conversationId, {
        messages,
        updatedAt: new Date(),
      });
    }

    const agent = await this.agentRepo.findById(conversation.agentId);
    if (!agent) throw new NotFoundError('Agent not found', 'AGENT_NOT_FOUND');

    const tools = DomainToolService.getEffectiveTools(agent);
    const context: ToolExecutionContext = {
      agentId: agent.agentId,
      userId: request.userId,
      conversationId: conversation.conversationId,
      lastUserMessage: request.userMessage,
    };

    const systemInstruction = BASE_SYSTEM_PROMPT + '\n' + (agent.config.instructions || '');

    const stream = this.orchestrator.runStream(messages, tools, systemInstruction, context);

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for await (const chunk of stream) {
      if (chunk.newMessages) {
        conversation.messages.push(...chunk.newMessages);
        await this.convoRepo.update(conversation.conversationId, {
          messages: conversation.messages,
          updatedAt: new Date(),
        });
      }
      // Accumulate token usage from stream chunks
      if (chunk.usage) {
        totalInputTokens += chunk.usage.promptTokens || 0;
        totalOutputTokens += chunk.usage.completionTokens || 0;
      }
      yield chunk;
    }

    // Post-stream: deduct CUs
    try {
      if (totalInputTokens > 0 || totalOutputTokens > 0) {
        await this.deductCUs.execute({
          userId: request.userId,
          agentId: agent.agentId,
          conversationId: conversation.conversationId,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          cachedTokens: 0,
        });
      }
    } catch (error) {
      this.logger.error('Failed to deduct CUs after stream', {
        userId: request.userId,
        agentId: agent.agentId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
