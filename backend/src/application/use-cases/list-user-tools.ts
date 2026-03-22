import { IToolRepository } from '../../domain/ports';

export class ListUserToolsUseCase {
  constructor(private toolRepo: IToolRepository) {}

  async execute(userId: string) {
    return await this.toolRepo.findByUserId(userId);
  }
}
