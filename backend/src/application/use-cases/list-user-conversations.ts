import { IConversationRepository } from '../../domain/ports';

export class ListUserConversationsUseCase {
  constructor(private convoRepo: IConversationRepository) {}

  async execute(userId: string) {
    return await this.convoRepo.findByUserId(userId);
  }
}
