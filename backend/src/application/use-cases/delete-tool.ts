import { IToolRepository } from '../../domain/ports';

export class DeleteToolUseCase {
  constructor(private toolRepo: IToolRepository) {}

  async execute(toolId: string, userId: string) {
    return await this.toolRepo.delete(toolId, userId);
  }
}
