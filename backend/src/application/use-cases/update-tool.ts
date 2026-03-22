import { IToolRepository } from '../../domain/ports';
import { ITool } from '../../domain/models';

export class UpdateToolUseCase {
  constructor(private toolRepo: IToolRepository) {}

  async execute(toolId: string, updates: Partial<ITool>, userId: string): Promise<ITool | null> {
    const tool = await this.toolRepo.findById(toolId);
    if (!tool || tool.userId !== userId) {
      throw new Error('Tool not found or unauthorized');
    }
    return await this.toolRepo.update(toolId, updates);
  }
}
