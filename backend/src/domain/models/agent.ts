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

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum BillingTier {
  NONE = 'none',
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
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

export interface IBillingAccount {
  userId: string;
  tier: BillingTier;
  cuBalance: number;
  grantedCuBalance: number;
  totalCuUsed: number;
  billingCycleStart: Date;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface ICoupon {
  code: string;
  tier: BillingTier;
  cuGrant: number;
  maxUses: number;
  usedCount: number;
  usedBy: string[];
  expiresAt?: Date | undefined;
  active: boolean;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface IUsageLog {
  userId: string;
  agentId: string;
  conversationId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  cuDeducted: number;
  timestamp: Date;
}

export interface IFeedback {
  feedbackId: string;
  userId: string;
  type: 'bug' | 'suggestion';
  content: string;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface IUserPin {
  userId: string;
  agentId: string;
  createdAt?: Date | undefined;
}
