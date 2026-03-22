import { MemoryReadAccess, MemoryWriteAccess } from '../models';

export interface MemoryGetRequest {
  agentId: string;
  query: string;
  currentUserId: string;
  ownerId: string;
  readAccess: MemoryReadAccess;
}

export interface MemorySetRequest {
  agentId: string;
  conversationId: string;
  text: string;
  currentUserId: string;
  ownerId: string;
  writeAccess: MemoryWriteAccess;
  metadata?: Record<string, unknown>;
}

export interface MemoryItem {
  memoryId: string;
  text: string;
  score: number;
}

export interface IMemoryService {
  get(request: MemoryGetRequest): Promise<{ ok: boolean; items: MemoryItem[] }>;
  set(request: MemorySetRequest): Promise<{ ok: boolean; memoryId: string; error?: string }>;
  list(agentId: string): Promise<{ ok: boolean; items: MemoryItem[] }>;
}
