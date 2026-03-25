import { NextFunction, Response } from 'express';
import { createToolDto, updateToolDto } from './dto';
import { AuthRequest } from '../middlewares/auth';
import { logger } from '../../infrastructure/utils/logger';
import { DIContainer } from '../../infrastructure/di/container';

export class ToolController {
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

      const dto = createToolDto.parse(req.body);
      const tool = await DIContainer.createTool.execute({
        name: dto.name,
        description: dto.description,
        url: dto.url,
        method: dto.method,
        userId,
        ...(dto.headers ? { headers: dto.headers } : {}),
        ...(dto.apiSchema ? { apiSchema: dto.apiSchema } : {}),
      });
      logger.info('Tool created via port', { toolId: tool.toolId, userId });
      return res.status(201).json(tool);
    } catch (error) {
      return next(error);
    }
  };

  public listMyTools = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.user;
      if (!user) throw new Error('Unauthorized');
      const userId = user.userId;

      const tools = await DIContainer.listUserTools.execute(userId);
      return res.status(200).json(tools);
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

      const toolId = req.params['toolId'];
      if (!toolId || typeof toolId !== 'string') throw new Error('Tool ID is required');

      const tool = await DIContainer.getToolById.execute(toolId as string, userId as string);
      if (!tool) {
        return res.status(404).json({ error: 'Tool not found' });
      }
      return res.status(200).json(tool);
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

      const toolId = req.params['toolId'];
      if (!toolId || typeof toolId !== 'string') throw new Error('Tool ID is required');

      const dto = updateToolDto.parse(req.body);
      const tool = await DIContainer.updateTool.execute(
        toolId as string,
        dto as any,
        userId as string,
      );
      logger.info('Tool updated via port', { toolId, userId });
      return res.status(200).json(tool);
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

      const toolId = req.params['toolId'];
      if (!toolId || typeof toolId !== 'string') throw new Error('Tool ID is required');

      const success = await DIContainer.deleteTool.execute(toolId as string, userId as string);
      if (!success) {
        return res.status(404).json({ error: 'Tool not found' });
      }
      logger.info('Tool deleted via port', { toolId, userId });
      return res.status(200).json({ ok: true });
    } catch (error) {
      return next(error);
    }
  };
}
