import { ITool } from '../models';

export interface IToolRepository {
  findById(toolId: string): Promise<ITool | null>;
  findByUserId(userId: string): Promise<ITool[]>;
  create(tool: ITool): Promise<void>;
  update(toolId: string, updates: Partial<ITool>): Promise<ITool | null>;
  delete(toolId: string, userId: string): Promise<boolean>;
}
