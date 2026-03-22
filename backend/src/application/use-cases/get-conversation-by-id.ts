import { IConversationRepository } from '../../domain/ports';
import { NotFoundError } from '../../domain/errors';

export class GetConversationByIdUseCase {
  constructor(private convoRepo: IConversationRepository) {}

  async execute(conversationId: string, _userId: string) {
    const conversation = await this.convoRepo.findById(conversationId);
    if (!conversation) throw new NotFoundError('Conversation not found', 'CONVO_NOT_FOUND');

    return conversation;
  }
}
