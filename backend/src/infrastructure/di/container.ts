import { VercelAiAdapter, OllamaEmbeddingAdapter } from '../adapters/llm';
import { QdrantAdapter } from '../adapters/vector-store';
import {
  MongoAgentRepository,
  MongoConversationRepository,
  MongoToolRepository,
  MongoUserRepository,
  MongoKnowledgeBaseRepository,
  MongoBillingRepository,
  MongoCouponRepository,
} from '../adapters/db';
import { ToolExecutionAdapter, MemoryServiceAdapter, RagServiceAdapter } from '../adapters/tools';
import { BcryptPasswordHasher, JwtTokenService } from '../adapters/auth';
import { AgentOrchestratorService } from '../../application/services';
import {
  ChatWithAgentUseCase,
  CreateAgentUseCase,
  IngestDocumentUseCase,
  RegisterUserUseCase,
  LoginUserUseCase,
  CreateToolUseCase,
  ListUserToolsUseCase,
  GetToolByIdUseCase,
  UpdateToolUseCase,
  DeleteToolUseCase,
  ListKnowledgeBaseUseCase,
  DeleteKnowledgeBaseDocUseCase,
  GetIngestionJobStatusUseCase,
  ListAgentMemoriesUseCase,
  ListUserAgentsUseCase,
  GetDiscoverAgentsUseCase,
  GetAgentByIdUseCase,
  UpdateAgentUseCase,
  DeleteAgentUseCase,
  ToggleAgentPinUseCase,
  ListPinnedAgentsUseCase,
  CreateConversationUseCase,
  ListUserConversationsUseCase,
  GetConversationByIdUseCase,
  DeleteConversationUseCase,
  GetBalanceUseCase,
  DeductCUsUseCase,
  RedeemCouponUseCase,
  AdminListUsersUseCase,
  AdminAddCUsUseCase,
  AdminCreateCouponUseCase,
  AdminListCouponsUseCase,
  AdminDeactivateCouponUseCase,
} from '../../application/use-cases';
import { env } from '../loaders/env';

export class DIContainer {
  // Repositories
  static readonly agentRepo = new MongoAgentRepository();
  static readonly convoRepo = new MongoConversationRepository();
  static readonly toolRepo = new MongoToolRepository();
  static readonly userRepo = new MongoUserRepository();
  static readonly kbRepo = new MongoKnowledgeBaseRepository();
  static readonly billingRepo = new MongoBillingRepository();
  static readonly couponRepo = new MongoCouponRepository();

  // Adapters for internal services
  static readonly memoryService = new MemoryServiceAdapter();
  static readonly ragService = new RagServiceAdapter();
  static readonly passwordHasher = new BcryptPasswordHasher();
  static readonly tokenService = new JwtTokenService();

  // LLM & Vector Store
  static getVercelAiAdapter() {
    return new VercelAiAdapter({
      useProvider: 'deepseek',
    });
  }
  static readonly llmProvider = DIContainer.getVercelAiAdapter();
  static readonly embeddingProvider = new OllamaEmbeddingAdapter(env.OLLAMA_URL);
  static readonly vectorStore = new QdrantAdapter(env.VECTOR_DB_URL, env.VECTOR_DB_API_KEY);

  // Tool Executor
  static readonly toolExecutor = new ToolExecutionAdapter(
    this.memoryService,
    this.ragService,
    this.agentRepo,
    this.toolRepo,
  );

  // Services
  static readonly orchestrator = new AgentOrchestratorService(this.llmProvider, this.toolExecutor);

  // Use Cases - Auth
  static readonly registerUser = new RegisterUserUseCase(
    this.userRepo,
    this.passwordHasher,
    this.tokenService,
    this.billingRepo,
  );
  static readonly loginUser = new LoginUserUseCase(
    this.userRepo,
    this.passwordHasher,
    this.tokenService,
  );

  // Use Cases - Billing
  static readonly getBalance = new GetBalanceUseCase(this.billingRepo, this.userRepo);
  static readonly deductCUs = new DeductCUsUseCase(this.billingRepo);
  static readonly redeemCoupon = new RedeemCouponUseCase(this.billingRepo, this.couponRepo);

  // Use Cases - Agents
  static readonly chatWithAgent = new ChatWithAgentUseCase(
    this.agentRepo,
    this.convoRepo,
    this.orchestrator,
    this.billingRepo,
    this.deductCUs,
  );
  static readonly createAgent = new CreateAgentUseCase(this.agentRepo, this.billingRepo);
  static readonly ingestDocument = new IngestDocumentUseCase(
    this.vectorStore,
    this.embeddingProvider,
  );
  static readonly listKnowledgeBase = new ListKnowledgeBaseUseCase(this.kbRepo);
  static readonly deleteKnowledgeBaseDoc = new DeleteKnowledgeBaseDocUseCase(
    this.kbRepo,
    this.agentRepo,
    this.ragService,
  );
  static readonly getIngestionJobStatus = new GetIngestionJobStatusUseCase(this.kbRepo);
  static readonly listAgentMemories = new ListAgentMemoriesUseCase(this.memoryService);
  static readonly listUserAgents = new ListUserAgentsUseCase(this.agentRepo);
  static readonly getDiscoverAgents = new GetDiscoverAgentsUseCase(this.agentRepo);
  static readonly getAgentById = new GetAgentByIdUseCase(this.agentRepo);
  static readonly updateAgent = new UpdateAgentUseCase(this.agentRepo);
  static readonly deleteAgent = new DeleteAgentUseCase(this.agentRepo);
  static readonly toggleAgentPin = new ToggleAgentPinUseCase(this.agentRepo);
  static readonly listPinnedAgents = new ListPinnedAgentsUseCase(this.agentRepo);

  // Use Cases - Tools
  static readonly createTool = new CreateToolUseCase(this.toolRepo);
  static readonly listUserTools = new ListUserToolsUseCase(this.toolRepo);
  static readonly getToolById = new GetToolByIdUseCase(this.toolRepo);
  static readonly updateTool = new UpdateToolUseCase(this.toolRepo);
  static readonly deleteTool = new DeleteToolUseCase(this.toolRepo);

  // Use Cases - Conversations
  static readonly createConversation = new CreateConversationUseCase(
    this.convoRepo,
    this.agentRepo,
  );
  static readonly listUserConversations = new ListUserConversationsUseCase(this.convoRepo);
  static readonly getConversationById = new GetConversationByIdUseCase(this.convoRepo);
  static readonly deleteConversation = new DeleteConversationUseCase(this.convoRepo);

  // Use Cases - Admin
  static readonly adminListUsers = new AdminListUsersUseCase(this.billingRepo);
  static readonly adminAddCUs = new AdminAddCUsUseCase(this.billingRepo);
  static readonly adminCreateCoupon = new AdminCreateCouponUseCase(this.couponRepo);
  static readonly adminListCoupons = new AdminListCouponsUseCase(this.couponRepo);
  static readonly adminDeactivateCoupon = new AdminDeactivateCouponUseCase(this.couponRepo);
}
