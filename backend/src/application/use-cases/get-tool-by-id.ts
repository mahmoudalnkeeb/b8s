import { IToolRepository } from '../../domain/ports';

export class GetToolByIdUseCase {
  constructor(private toolRepo: IToolRepository) {}

  async execute(toolId: string, userId: string) {
    const tool = await this.toolRepo.findById(toolId);
    if (!tool || tool.userId !== userId) {
      return null;
    }
    return tool;
  }
}
