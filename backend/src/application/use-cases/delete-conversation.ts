import { IConversationRepository } from '../../domain/ports';

export class DeleteConversationUseCase {
  constructor(private convoRepo: IConversationRepository) {}

  async execute(conversationId: string, userId: string) {
    return await this.convoRepo.delete(conversationId, userId);
  }
}
