import { MemoryService as LegacyMemoryService } from '../../external-services/memory';
import {
  IMemoryService,
  MemoryGetRequest,
  MemorySetRequest,
  MemoryItem,
} from '../../../domain/ports/memory-service';
import { MemoryReadAccess, MemoryWriteAccess } from '../../../domain/models';

export class MemoryServiceAdapter implements IMemoryService {
  private legacyService: LegacyMemoryService;

  constructor() {
    this.legacyService = new LegacyMemoryService();
  }

  async get(input: MemoryGetRequest): Promise<{ ok: boolean; items: MemoryItem[] }> {
    return await this.legacyService.get({
      agentId: input.agentId,
      query: input.query,
      currentUserId: input.currentUserId,
      ownerId: input.ownerId,
      readAccess: input.readAccess as unknown as MemoryReadAccess,
    });
  }

  async set(input: MemorySetRequest): Promise<{ ok: boolean; memoryId: string; error?: string }> {
    return await this.legacyService.set({
      agentId: input.agentId,
      conversationId: input.conversationId,
      text: input.text,
      currentUserId: input.currentUserId,
      ownerId: input.ownerId,
      writeAccess: input.writeAccess as unknown as MemoryWriteAccess,
      metadata: {
        userId: input.currentUserId,
        importance: (input.metadata?.['importance'] as number) || 1,
      },
    });
  }

  async list(agentId: string): Promise<{ ok: boolean; items: MemoryItem[] }> {
    return await this.legacyService.list(agentId);
  }
}
