import { NextFunction, Response, Request } from 'express';
import { createAgentDto, updateAgentDto } from './dto';
import { AuthRequest } from '../middlewares/auth';
import { logger } from '../../infrastructure/utils/logger';
import { DIContainer } from '../../infrastructure/di/container';
import { randomUUID } from 'crypto';
import {
  AccessType,
  MemoryReadAccess,
  MemoryWriteAccess,
  IAgent,
} from '../../infrastructure/db/models';

export class AgentController {
  constructor() {}

  public create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new Error('Unauthorized');
      const userId = user.userId;

      const dto = createAgentDto.parse(req.body);

      // Resolve tools from toolIds
      const toolRepo = DIContainer.toolRepo;
      const toolDefinitions: any[] = [];
      if (dto.config.tools && dto.config.tools.length > 0) {
        for (const toolId of dto.config.tools) {
          const tool = await toolRepo.findById(toolId);
          if (tool) {
            toolDefinitions.push({
              name: tool.name,
              description: tool.description,
              apiSchema: tool.apiSchema,
            });
          }
        }
      }

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
      logger.info('Agent created via port', { userId });
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
      if (!user) throw new Error('Unauthorized');
      const userId = user.userId;

      const agents = await DIContainer.listUserAgents.execute(userId);
      return res.status(200).json(agents);
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
      if (!user) throw new Error('Unauthorized');
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string') throw new Error('Agent ID is required');

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
      if (!user) throw new Error('Unauthorized');
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string') throw new Error('Agent ID is required');

      const dto = updateAgentDto.parse(req.body);

      // Resolve tools if provided in config
      if (dto.config?.tools && Array.isArray(dto.config.tools)) {
        const toolRepo = DIContainer.toolRepo;
        const toolDefinitions: any[] = [];
        for (const toolId of dto.config.tools) {
          const tool = await toolRepo.findById(toolId);
          if (tool) {
            toolDefinitions.push({
              name: tool.name,
              description: tool.description,
              apiSchema: tool.apiSchema,
            });
          }
        }
        (dto.config as any).tools = toolDefinitions;
      }

      const agent = await DIContainer.updateAgent.execute(
        agentId as string,
        dto as unknown as import('../../domain/models').IAgent,
        userId as string,
      );
      logger.info('Agent updated via port', { agentId, userId });
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
      if (!user) throw new Error('Unauthorized');
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string') throw new Error('Agent ID is required');

      const agent = await DIContainer.updateAgent.execute(
        agentId as string,
        { deployed: true } as unknown as import('../../domain/models').IAgent,
        userId as string,
      );
      logger.info('Agent deployed via port', { agentId, userId });
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
      if (!user) throw new Error('Unauthorized');
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string') throw new Error('Agent ID is required');

      const success = await DIContainer.deleteAgent.execute(agentId as string, userId as string);
      if (!success) {
        return res.status(404).json({ error: 'Agent not found or unauthorized' });
      }
      logger.info('Agent deleted via port', { agentId, userId });
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
      if (!user) throw new Error('Unauthorized');
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string') throw new Error('Agent ID is required');

      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      logger.info('Knowledge base upload started', {
        agentId,
        ownerId: userId,
        fileName: file.originalname,
      });

      const jobId = randomUUID();
      const docId = randomUUID();

      // Ensure JobStatus is used correctly via DIContainer's domain model
      await DIContainer.kbRepo.createDoc({
        docId,
        agentId,
        fileName: file.originalname,
        content: '',
        metadata: { userId },
      });

      await DIContainer.kbRepo.createJob({
        jobId,
        agentId,
        fileName: file.originalname,
        status: 'pending' as import('../../domain/models').JobStatus,
        totalChunks: 0,
        processedChunks: 0,
      });

      let content = '';
      if (file.originalname.toLowerCase().endsWith('.pdf') || file.mimetype === 'application/pdf') {
        const pdfParse = await import('pdf-parse');
        const parser = new pdfParse.PDFParse({ data: file.buffer });
        const parsed = await parser.getText();
        content = parsed.text;
      } else {
        content = file.buffer.toString('utf-8');
      }

      // Add document ingestion job to BullMQ queue
      const job = await DIContainer.queueService.addJob(
        'document-ingestion',
        'documentIngestion',
        {
          agentId,
          docId,
          content,
          fileName: file.originalname,
          jobId,
        },
        {
          jobId, // Use the same jobId for tracking
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      );

      logger.info('Document ingestion job queued', {
        jobId: job.id,
        agentId,
        fileName: file.originalname,
      });

      return res.status(202).json({ success: true, jobId, queueJobId: job.id });
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
      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string') throw new Error('Agent ID is required');

      const docs = await DIContainer.listKnowledgeBase.execute(agentId as string);
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
      if (!user) throw new Error('Unauthorized');
      const userId = user.userId;

      const agentId = req.params['agentId'];
      const docId = req.params['docId'];
      if (!agentId || typeof agentId !== 'string' || !docId || typeof docId !== 'string') {
        throw new Error('Agent ID and Doc ID are required');
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
      const agentId = req.params['agentId'];
      const jobId = req.params['jobId'];
      if (!agentId || typeof agentId !== 'string' || !jobId || typeof jobId !== 'string') {
        throw new Error('Agent ID and Job ID are required');
      }

      const job = await DIContainer.getIngestionJobStatus.execute(
        jobId as string,
        agentId as string,
      );
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
      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string') {
        throw new Error('Agent ID is required');
      }

      const job = await DIContainer.getAgentLatestJob.execute(agentId as string);

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
      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string') throw new Error('Agent ID is required');

      const memories = await DIContainer.listAgentMemories.execute(agentId as string);
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
      if (!user) throw new Error('Unauthorized');
      const userId = user.userId;

      const agentId = req.params['agentId'];
      if (!agentId || typeof agentId !== 'string') throw new Error('Agent ID is required');

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
      if (!user) throw new Error('Unauthorized');
      const userId = user.userId;

      const agents = await DIContainer.listPinnedAgents.execute(userId);
      return res.status(200).json(agents);
    } catch (error) {
      return next(error);
    }
  };
}
