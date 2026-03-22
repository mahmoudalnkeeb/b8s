import { IMemoryService } from '../../domain/ports';

export class ListAgentMemoriesUseCase {
  constructor(private memoryService: IMemoryService) {}

  async execute(agentId: string) {
    return await this.memoryService.list(agentId);
  }
}
