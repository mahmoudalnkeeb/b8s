import { randomUUID } from 'crypto';
import { IToolRepository } from '../../domain/ports';
import { ITool } from '../../domain/models';

export interface CreateToolRequest {
  name: string;
  description: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  apiSchema?: Record<string, unknown>;
  userId: string;
}

export class CreateToolUseCase {
  constructor(private toolRepo: IToolRepository) {}

  async execute(request: CreateToolRequest): Promise<ITool> {
    const toolId = randomUUID();
    const toolData: ITool = {
      toolId,
      ...request,
    };
    await this.toolRepo.create(toolData);
    return toolData;
  }
}
