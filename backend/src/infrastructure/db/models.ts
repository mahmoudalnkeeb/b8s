import { Schema, model, Document } from 'mongoose';

// --- Enums ---
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

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
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

// --- Interfaces ---
export interface IAccessRules {
  type: AccessType;
  allowList?: string[];
}

export interface IToolDefinition {
  name: string;
  description: string;
  apiSchema?: Record<string, unknown>;
}

export interface ITool extends Document {
  toolId: string;
  userId: string;
  name: string;
  description: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Map<string, string>;
  apiSchema?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAgentConfig {
  instructions: string;
  tools: IToolDefinition[];
  memoryEnabled: boolean;
  memoryReadAccess: MemoryReadAccess;
  memoryWriteAccess: MemoryWriteAccess;
  ragEnabled: boolean;
}

export interface IMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
  toolCalls?: { id: string; name: string; arguments: Record<string, unknown> }[];
  metadata?: Record<string, unknown>;
}

export interface IUser extends Document {
  userId: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBillingAccount extends Document {
  userId: string;
  tier: BillingTier;
  cuBalance: number;
  grantedCuBalance: number;
  totalCuUsed: number;
  billingCycleStart: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoupon extends Document {
  code: string;
  tier: BillingTier;
  cuGrant: number;
  maxUses: number;
  usedCount: number;
  usedBy: string[];
  expiresAt?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUsageLog extends Document {
  userId: string;
  agentId: string;
  conversationId: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  cuDeducted: number;
  timestamp: Date;
}

export interface IAgent extends Document {
  agentId: string;
  ownerId: string;
  name: string;
  description: string;
  tags: string[];
  config: IAgentConfig;
  accessRules: IAccessRules;
  deployed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPin extends Document {
  userId: string;
  agentId: string;
  createdAt: Date;
}

export interface IConversation extends Document {
  conversationId: string;
  agentId: string;
  agentName?: string;
  userId: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IKnowledgeBaseDoc extends Document {
  docId: string;
  agentId: string;
  fileName: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface IIngestionJob extends Document {
  jobId: string;
  agentId: string;
  fileName: string;
  status: JobStatus;
  totalChunks: number;
  processedChunks: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// --- Schemas ---

const ToolSchema = new Schema<ITool>(
  {
    toolId: { type: String, required: true, unique: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    url: { type: String, required: true },
    method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], required: true },
    headers: { type: Map, of: String },
    apiSchema: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

const UserSchema = new Schema<IUser>(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
  },
  { timestamps: true },
);

const BillingAccountSchema = new Schema<IBillingAccount>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    tier: { type: String, enum: Object.values(BillingTier), default: BillingTier.NONE },
    cuBalance: { type: Number, default: 0 },
    grantedCuBalance: { type: Number, default: 0 },
    totalCuUsed: { type: Number, default: 0 },
    billingCycleStart: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tier: { type: String, enum: Object.values(BillingTier), required: true },
    cuGrant: { type: Number, required: true },
    maxUses: { type: Number, required: true },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: String }],
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const UsageLogSchema = new Schema<IUsageLog>(
  {
    userId: { type: String, required: true, index: true },
    agentId: { type: String, required: true },
    conversationId: { type: String, required: true },
    inputTokens: { type: Number, required: true },
    outputTokens: { type: Number, required: true },
    cachedTokens: { type: Number, default: 0 },
    cuDeducted: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

const AgentSchema = new Schema<IAgent>(
  {
    agentId: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    tags: [{ type: String, index: true }],
    config: {
      instructions: { type: String, required: true, default: '' },
      tools: [
        {
          name: String,
          description: String,
          apiSchema: Schema.Types.Mixed,
        },
      ],
      memoryEnabled: { type: Boolean, default: true },
      memoryReadAccess: {
        type: String,
        enum: Object.values(MemoryReadAccess),
        default: MemoryReadAccess.PRIVATE,
      },
      memoryWriteAccess: {
        type: String,
        enum: Object.values(MemoryWriteAccess),
        default: MemoryWriteAccess.PRIVATE,
      },
      ragEnabled: { type: Boolean, default: true },
    },
    accessRules: {
      type: {
        type: String,
        enum: Object.values(AccessType),
        default: AccessType.PRIVATE,
        index: true,
      },
      allowList: [{ type: String }],
    },
    deployed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const UserPinSchema = new Schema<IUserPin>(
  {
    userId: { type: String, required: true, index: true },
    agentId: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
UserPinSchema.index({ userId: 1, agentId: 1 }, { unique: true });

const ConversationSchema = new Schema<IConversation>(
  {
    conversationId: { type: String, required: true, unique: true },
    agentId: { type: String, required: true, index: true },
    agentName: { type: String },
    userId: { type: String, required: true, index: true },
    messages: [
      {
        role: { type: String, enum: Object.values(MessageRole), required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        metadata: { type: Schema.Types.Mixed },
        toolCalls: [
          {
            id: String,
            name: String,
            arguments: Schema.Types.Mixed,
          },
        ],
      },
    ],
  },
  { timestamps: true },
);

const KnowledgeBaseDocSchema = new Schema<IKnowledgeBaseDoc>(
  {
    docId: { type: String, required: true, unique: true },
    agentId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    content: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

const IngestionJobSchema = new Schema<IIngestionJob>(
  {
    jobId: { type: String, required: true, unique: true },
    agentId: { type: String, required: true, index: true },
    fileName: { type: String, required: true },
    status: { type: String, enum: Object.values(JobStatus), default: JobStatus.PENDING },
    totalChunks: { type: Number, default: 0 },
    processedChunks: { type: Number, default: 0 },
    error: { type: String },
  },
  { timestamps: true },
);

// --- Models ---
export const ToolModel = model<ITool>('Tool', ToolSchema);
export const UserModel = model<IUser>('User', UserSchema);
export const AgentModel = model<IAgent>('Agent', AgentSchema);
export const UserPinModel = model<IUserPin>('UserPin', UserPinSchema);
export const ConversationModel = model<IConversation>('Conversation', ConversationSchema);
export const KnowledgeBaseDocModel = model<IKnowledgeBaseDoc>(
  'KnowledgeBaseDoc',
  KnowledgeBaseDocSchema,
);
export const IngestionJobModel = model<IIngestionJob>('IngestionJob', IngestionJobSchema);
export const BillingAccountModel = model<IBillingAccount>('BillingAccount', BillingAccountSchema);
export const CouponModel = model<ICoupon>('Coupon', CouponSchema);
export const UsageLogModel = model<IUsageLog>('UsageLog', UsageLogSchema);
