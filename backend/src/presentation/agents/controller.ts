import { NextFunction, Response, Request } from 'express';
import { createAgentDto, updateAgentDto } from './dto';
import { AuthRequest } from '../middlewares/auth';
import { DIContainer } from '../../infrastructure/di/container';
import { randomUUID } from 'crypto';
import {
  AccessType,
  MemoryReadAccess,
  MemoryWriteAccess,
  IAgent,
  IToolDefinition,
} from '../../domain/models';
import { UnauthorizedError, ValidationError } from '../../domain/errors';

export class AgentController {
  private async resolveToolDefinitions(toolIds: string[]): Promise<IToolDefinition[]> {
    const toolDefinitions: IToolDefinition[] = [];
    if (toolIds.length > 0) {
      for (const toolId of toolIds) {
        const tool = await DIContainer.toolRepo.findById(toolId);
        if (tool) {
          toolDefinitions.push({
            name: tool.name,
            description: tool.description,
            apiSchema: tool.apiSchema,
          });
        }
      }
    }
    return toolDefinitions;
  }

  public create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const dto = createAgentDto.parse(req.body);

      const toolDefinitions = await this.resolveToolDefinitions(dto.config.tools || []);

      const accessRules: { type: AccessType; allowList?: string[] } = {
        type: (dto.accessRules?.type as AccessType) || AccessType.PRIVATE,
      };
      if (dto.accessRules?.allowList) {
        accessRules.allowList = dto.accessRules.allowList;
      }

      const agentData = {
        name: dto.name,
        description: dto.description || '',
        tags: dto.tags || [],
        config: {
          instructions: dto.config.instructions,
          tools: toolDefinitions,
          memoryEnabled: dto.config.memoryEnabled,
          memoryReadAccess: dto.config.memoryReadAccess as MemoryReadAccess,
          memoryWriteAccess: dto.config.memoryWriteAccess as MemoryWriteAccess,
          ragEnabled: dto.config.ragEnabled,
        },
        ownerId: userId,
        agentId: randomUUID(),
        accessRules,
        deployed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as unknown as IAgent;

      await DIContainer.createAgent.execute(
        agentData as unknown as import('../../domain/models').IAgent,
      );
      DIContainer.logger.info('Agent created via port', { userId });
      return res.status(201).json(agentData);
    } catch (error) {
      return next(error);
    }
  };

  public listMyAgents = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 100);
      const offset = parseInt(req.query['offset'] as string) || 0;
      const search = req.query['search'] as string | undefined;

      const result = await DIContainer.listUserAgents.execute({ 
        userId, 
        limit, 
        offset, 
        search: search || '' 
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  public listDiscover = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const { search } = req.query;
      const agents = await DIContainer.getDiscoverAgents.execute(search as string);
      return res.status(200).json(agents);
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

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string')
        throw new ValidationError('Agent ID is required', 'MISSING_AGENT_ID');

      const agent = await DIContainer.getAgentById.execute(agentId as string, userId as string);
      return res.status(200).json(agent);
    } catch (error) {
      return next(error);
    }
  };

  public update = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string')
        throw new ValidationError('Agent ID is required', 'MISSING_AGENT_ID');

      const dto = updateAgentDto.parse(req.body);

      // Resolve tools if provided in config
      if (dto.config?.tools && Array.isArray(dto.config.tools)) {
        const toolDefinitions = await this.resolveToolDefinitions(dto.config.tools);
        (dto.config as unknown as { tools: IToolDefinition[] }).tools = toolDefinitions;
      }

      const agent = await DIContainer.updateAgent.execute(
        agentId as string,
        dto as unknown as import('../../domain/models').IAgent,
        userId as string,
      );
      DIContainer.logger.info('Agent updated via port', { agentId, userId });
      return res.status(200).json(agent);
    } catch (error) {
      return next(error);
    }
  };

  public deploy = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string')
        throw new ValidationError('Agent ID is required', 'MISSING_AGENT_ID');

      const agent = await DIContainer.updateAgent.execute(
        agentId as string,
        { deployed: true } as unknown as import('../../domain/models').IAgent,
        userId as string,
      );
      DIContainer.logger.info('Agent deployed via port', { agentId, userId });
      return res.status(200).json(agent);
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

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string')
        throw new ValidationError('Agent ID is required', 'MISSING_AGENT_ID');

      const success = await DIContainer.deleteAgent.execute(agentId as string, userId as string);
      if (!success) {
        return res.status(404).json({ error: 'Agent not found or unauthorized' });
      }
      DIContainer.logger.info('Agent deleted via port', { agentId, userId });
      return res.status(200).json({ ok: true });
    } catch (error) {
      return next(error);
    }
  };

  public uploadKnowledgeBase = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string')
        throw new ValidationError('Agent ID is required', 'MISSING_AGENT_ID');

      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      DIContainer.logger.info('Knowledge base upload started', {
        agentId,
        ownerId: userId,
        fileName: file.originalname,
      });

      const result = await DIContainer.uploadKnowledgeBase.execute({
        agentId,
        userId,
        fileName: file.originalname,
        fileBuffer: file.buffer,
        mimeType: file.mimetype,
      });

      DIContainer.logger.info('Document ingestion job queued', {
        jobId: result.queueJobId,
        agentId,
        fileName: file.originalname,
      });

      return res.status(202).json(result);
    } catch (error) {
      return next(error);
    }
  };

  public getKnowledgeBase = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string')
        throw new ValidationError('Agent ID is required', 'MISSING_AGENT_ID');

      // Verify agent ownership
      const agent = await DIContainer.agentRepo.findById(agentId);
      if (!agent || agent.ownerId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const docs = await DIContainer.listKnowledgeBase.execute(agentId);
      return res.status(200).json(docs);
    } catch (error) {
      return next(error);
    }
  };

  public deleteKnowledgeBaseDoc = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const agentId = req.params['agentId'];
      const docId = req.params['docId'];
      if (!agentId || typeof agentId !== 'string' || !docId || typeof docId !== 'string') {
        throw new ValidationError('Agent ID and Doc ID are required', 'MISSING_IDS');
      }

      const result = await DIContainer.deleteKnowledgeBaseDoc.execute({
        agentId: agentId as string,
        docId: docId as string,
        ownerId: userId as string,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  public getJobStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const agentId = req.params['agentId'];
      const jobId = req.params['jobId'];
      if (!agentId || typeof agentId !== 'string' || !jobId || typeof jobId !== 'string') {
        throw new ValidationError('Agent ID and Job ID are required', 'MISSING_IDS');
      }

      // Verify agent ownership
      const agent = await DIContainer.agentRepo.findById(agentId);
      if (!agent || agent.ownerId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const job = await DIContainer.getIngestionJobStatus.execute(jobId, agentId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      return res.status(200).json(job);
    } catch (error) {
      return next(error);
    }
  };

  public getLatestJobStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string') {
        throw new ValidationError('Agent ID is required', 'MISSING_AGENT_ID');
      }

      // Verify agent ownership
      const agent = await DIContainer.agentRepo.findById(agentId);
      if (!agent || agent.ownerId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const job = await DIContainer.getAgentLatestJob.execute(agentId);

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      return res.status(200).json(job);
    } catch (error) {
      return next(error);
    }
  };

  public listMemories = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string')
        throw new ValidationError('Agent ID is required', 'MISSING_AGENT_ID');

      // Verify agent ownership
      const agent = await DIContainer.agentRepo.findById(agentId);
      if (!agent || agent.ownerId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const memories = await DIContainer.listAgentMemories.execute(agentId);
      return res.status(200).json(memories);
    } catch (error) {
      return next(error);
    }
  };

  public togglePin = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string')
        throw new ValidationError('Agent ID is required', 'MISSING_AGENT_ID');

      const result = await DIContainer.toggleAgentPin.execute(agentId as string, userId as string);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  public listPinned = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new UnauthorizedError();
      const userId = user.userId;

      const agents = await DIContainer.listPinnedAgents.execute(userId);
      return res.status(200).json(agents);
    } catch (error) {
      return next(error);
    }
  };
}
