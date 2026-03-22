import { randomUUID } from 'crypto';
import { IConversationRepository, IAgentRepository } from '../../domain/ports';
import { IConversation } from '../../domain/models';
import { NotFoundError } from '../../domain/errors';

export interface CreateConversationRequest {
  agentId: string;
  userId: string;
}

export class CreateConversationUseCase {
  constructor(
    private convoRepo: IConversationRepository,
    private agentRepo: IAgentRepository,
  ) {}

  async execute(request: CreateConversationRequest): Promise<IConversation> {
    const agent = await this.agentRepo.findById(request.agentId);
    if (!agent) throw new NotFoundError('Agent not found', 'AGENT_NOT_FOUND');

    const conversation: IConversation = {
      conversationId: randomUUID(),
      agentId: request.agentId,
      userId: request.userId,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.convoRepo.create(conversation);
    return conversation;
  }
}
