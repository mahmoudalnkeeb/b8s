import { IToolDefinition } from './tool';

export enum AccessType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  ALLOW_LIST = 'allow_list',
}
export enum MemoryReadAccess {
  PUBLIC = 'public',
  PRIVATE = 'private',
  CREATED_ONLY = 'created_only',
}
export enum MemoryWriteAccess {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export interface IAgentConfig {
  instructions: string;
  tools: IToolDefinition[];
  memoryEnabled: boolean;
  memoryReadAccess: MemoryReadAccess;
  memoryWriteAccess: MemoryWriteAccess;
  ragEnabled: boolean;
}

export interface IAgent {
  agentId: string;
  ownerId: string;
  name: string;
  description: string | undefined;
  config: IAgentConfig;
  accessRules: { type: AccessType; allowList?: string[] | undefined };
  deployed?: boolean | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface IUser {
  userId: string;
  email: string;
  name: string;
  role?: string | undefined;
  passwordHash: string;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ITool {
  toolId: string;
  userId: string;
  name: string;
  description: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string> | undefined;
  apiSchema?: Record<string, unknown> | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface IKnowledgeBaseDoc {
  docId: string;
  agentId: string;
  fileName: string;
  content?: string | undefined;
  metadata: Record<string, unknown>;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface IIngestionJob {
  jobId: string;
  agentId: string;
  fileName: string;
  status: JobStatus;
  totalChunks: number;
  processedChunks: number;
  error?: string | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}
