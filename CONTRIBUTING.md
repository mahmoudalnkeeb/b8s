# CONTRIBUTING.md - Comprehensive Contributor Onboarding Guide

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Development Setup](#2-development-setup)
3. [Architecture Overview](#3-architecture-overview)
4. [Code Review Walkthrough](#4-code-review-walkthrough)
5. [Backend Deep Dive](#5-backend-deep-dive)
6. [Frontend Deep Dive](#6-frontend-deep-dive)
7. [How to Add New Features](#7-how-to-add-new-features)
8. [Running & Testing](#8-running--testing)
9. [Code Style Guidelines](#9-code-style-guidelines)
10. [Known Issues for Contributors](#10-known-issues-for-contributors)

---

## 1. Prerequisites

### 1.1 Technical Requirements

Before contributing, ensure you have the following installed:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18+ (LTS 20+) | JavaScript runtime |
| **Yarn** | 1.x (classic) | Package manager for monorepo |
| **Docker** | Latest | Container runtime |
| **Docker Compose** | Latest | Multi-container orchestration |
| **Git** | Latest | Version control |

### 1.2 Required Knowledge

#### Backend Stack
- **TypeScript** - Strong typing, strict mode
- **Express** - HTTP server framework
- **MongoDB/Mongoose** - Primary database
- **Clean Architecture** - Domain → Application → Infrastructure → Presentation
- **Vercel AI SDK** - Multi-provider LLM abstraction

#### Frontend Stack
- **React 19** - UI framework
- **TanStack Router** - File-based routing
- **TanStack Query** - Server state management (React Query)
- **Tailwind CSS** - Styling

### 1.3 Understanding Key Technologies

| Technology | Purpose | Where to Learn |
|------------|---------|----------------|
| **MongoDB** | Primary database for users, agents, conversations | [MongoDB Docs](https://docs.mongodb.com) |
| **Qdrant** | Vector database for RAG embeddings | [Qdrant Docs](https://qdrant.tech/documentation/) |
| **Redis/BullMQ** | Async job queue for document processing | [BullMQ Docs](https://docs.bullmq.io) |
| **Ollama** | Local LLM + embedding generation | [Ollama Docs](https://github.com/ollama/ollama) |
| **Vercel AI SDK** | Unified LLM provider interface | [AI SDK Docs](https://sdk.vercel.ai) |

---

## 2. Development Setup

### 2.1 Clone & Install

```bash
# Clone the repository
git clone https://github.com/mahmoudalnakeeb/b8s.git
cd b8s

# Install all dependencies (monorepo)
yarn install
```

### 2.2 Environment Configuration

Create a `.env` file in the root directory:

```env
# ============================================
# SERVER CONFIG
# ============================================
PORT=3000
NODE_ENV=development

# ============================================
# AUTHENTICATION
# ============================================
JWT_SECRET=your-super-secret-key-min-32-characters
JWT_EXPIRES_IN=24h

# ============================================
# DATABASE - MongoDB (Docker mapped port)
# ============================================
MONGODB_URI=mongodb://localhost:27018/b8s

# ============================================
# VECTOR DATABASE - Qdrant
# ============================================
VECTOR_DB_TYPE=qdrant
VECTOR_DB_URL=http://localhost:6333
VECTOR_DB_API_KEY=  # Optional: for production

# ============================================
# REDIS - Job Queue
# ============================================
REDIS_URL=redis://localhost:6379

# ============================================
# OLLAMA - Local LLM & Embeddings
# ============================================
OLLAMA_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text-v2-moe

# ============================================
# LLM PROVIDERS
# ============================================
GEMINI_API_KEY=your-gemini-api-key
GENAI_MODEL=gemini-2.0-flash
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat

# ============================================
# EMAIL (for password reset)
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

> **Note:** For development, you can skip API keys if using Ollama only. For full functionality, obtain keys from Google AI Studio and DeepSeek.

### 2.3 Start Services

#### Option A: Full Docker Stack (Recommended)
```bash
# Start all services (app, frontend, mongodb, qdrant, redis, ollama)
docker compose up -d --build

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

#### Option B: Hybrid (Infrastructure + Local Dev)
```bash
# Start only infrastructure services
docker compose up -d mongodb qdrant redis ollama

# Terminal 1 - Backend (hot reload)
cd backend && yarn dev

# Terminal 2 - Frontend (hot reload)
cd frontend && yarn dev
```

### 2.4 Service URLs

| Service | URL | Docker Port |
|---------|-----|-------------|
| Backend API | `http://localhost:3000` | 3000 |
| Frontend | `http://localhost:3001` | 3001 |
| MongoDB | `localhost:27018` | 27018 |
| Qdrant Dashboard | `http://localhost:6333/dashboard` | 6333 |
| Redis | `localhost:6380` | 6380 |
| Ollama | `http://localhost:11435` | 11435 |

---

## 3. Architecture Overview

### 3.1 Monorepo Structure

```
b8s/
├── backend/                    # Node.js/Express API
│   └── src/
│       ├── application/        # Use cases & orchestration
│       │   ├── services/      # AgentOrchestratorService
│       │   └── use-cases/      # 40+ business logic classes
│       ├── domain/            # Interfaces, models, errors
│       │   ├── models/        # IAgent, IConversation, etc.
│       │   ├── ports/         # IUserRepository, ILLMProvider
│       │   ├── errors/        # DomainError subclasses
│       │   └── services/      # ToolService (built-in tools)
│       ├── infrastructure/   # Adapters & implementations
│       │   ├── adapters/      # DB repos, LLM providers, tools
│       │   ├── db/            # MongoDB connection + models
│       │   ├── di/            # DIContainer (static DI)
│       │   ├── queue/         # BullMQ setup
│       │   └── loaders/       # Env validation
│       └── presentation/      # HTTP layer
│           ├── controllers/  # Request handlers
│           ├── routers/       # Express routes
│           ├── middlewares/   # Auth, error, rate-limit
│           └── dto/           # Zod validation schemas
│
└── frontend/                   # React/Vite SPA
    └── src/
        ├── api/              # Axios client + service functions
        ├── components/       # Reusable UI components
        │   ├── agents/       # Agent-specific components
        │   └── ui/           # shadcn/ui primitives
        ├── hooks/           # Custom React hooks
        │   ├── use-auth.tsx  # Authentication context
        │   ├── use-chat-stream.ts  # SSE streaming
        │   └── use-theme.tsx # Dark/light mode
        └── routes/           # TanStack Router pages
```

### 3.2 Clean Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                 Presentation Layer                   │
│     Controllers, Routes, DTOs, Middleware           │
├─────────────────────────────────────────────────────┤
│                 Application Layer                   │
│              Use Cases, Orchestrator                │
├─────────────────────────────────────────────────────┤
│                    Domain Layer                      │
│       Models, Ports (Interfaces), Errors            │
├─────────────────────────────────────────────────────┤
│                Infrastructure Layer                 │
│      DB, LLM Providers, Queue, External Services    │
└─────────────────────────────────────────────────────┘
```

**Key Principle**: Inner layers never import from outer layers. Domain defines interfaces (ports), Infrastructure implements them (adapters).

### 3.3 Data Flow: Chat Request

```
User sends message (Frontend)
    │
    ▼
HTTP POST /api/conversations/:id/messages
    │
    ▼
AuthMiddleware (validates JWT)
    │
    ▼
ConversationController (receives request)
    │
    ▼
ChatWithAgentUseCase (orchestrates everything)
    │
    ├──────▶ AgentOrchestratorService (LLM + tools loop)
    │            │
    │            ├──────▶ ILLMProvider (DeepSeek/Gemini/Ollama)
    │            │
    │            └──────▶ ToolExecutor (memory, RAG, custom tools)
    │
    ├──────▶ DeductCUsUseCase (billing)
    │
    └──────▶ MongoConversationRepository (persist messages)

SSE Stream back to client
```

### 3.4 Data Flow: Document Ingestion

```
User uploads PDF to Knowledge Base (Frontend)
    │
    ▼
POST /api/agents/:agentId/kb (multipart upload)
    │
    ▼
UploadKnowledgeBaseUseCase
    │
    ▼
QueueService.addJob('document-ingestion')
    │
    ▼
BullMQ Worker (async, separate process)
    │
    ├──────▶ PDF Parser (pdf-parse)
    │
    ├──────▶ Semantic Chunker (split into chunks)
    │
    ├──────▶ Ollama Embeddings (nomic-embed-text-v2-moe)
    │
    └──────▶ Qdrant (store vectors with metadata)

Status updates via GET /api/agents/:agentId/jobs/latest
```

---

## 4. Code Review Walkthrough

### 4.1 Where to Start

Review these files in order to understand the codebase:

| Priority | File | Why |
|----------|------|-----|
| **1** | `backend/src/infrastructure/di/container.ts` | Shows all dependencies and how they're wired together |
| **2** | `backend/src/presentation/app.ts` | Express middleware stack, CORS, error handling |
| **3** | `backend/src/application/services/agent-orchestrator.ts` | Core LLM + tool execution loop |
| **4** | `frontend/src/api/client.ts` | Axios setup, token injection, 401 handling |
| **5** | `frontend/src/routes/__root.tsx` | Root layout, routing setup |

### 4.2 Understanding the Flow: Login Example

Let's trace how a login request flows through the entire stack:

#### Step 1: Route Definition
**File**: `backend/src/presentation/auth/router.ts:37`
```typescript
router.post('/login', controller.login);
```

#### Step 2: Controller
**File**: `backend/src/presentation/auth/controller.ts`
```typescript
async login(req, res, next) {
  try {
    const dto = loginSchema.parse(req.body);  // Zod validation
    const result = await DIContainer.loginUser.execute(dto);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
```

#### Step 3: Use Case (Business Logic)
**File**: `backend/src/application/use-cases/login-user.ts`
```typescript
export class LoginUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService,
  ) {}

  async execute(request: LoginRequest) {
    // 1. Find user by email
    const user = await this.userRepo.findByEmail(request.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // 2. Verify password
    const isPasswordValid = await this.passwordHasher.compare(
      request.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // 3. Generate JWT
    const expiresIn = request.rememberMe ? '30d' : undefined;
    const token = this.tokenService.generate(
      { userId: user.userId, email: user.email },
      expiresIn,
    );

    return { token, userId: user.userId, email: user.email };
  }
}
```

#### Step 4: Dependencies (DI Container)
**File**: `backend/src/infrastructure/di/container.ts:127-131`
```typescript
static readonly loginUser = new LoginUserUseCase(
  this.userRepo,           // MongoUserRepository (implements IUserRepository)
  this.passwordHasher,     // BcryptPasswordHasher (implements IPasswordHasher)
  this.tokenService,       // JwtTokenService (implements ITokenService)
);
```

#### Step 5: Repository (Database)
**File**: `backend/src/infrastructure/adapters/db/mongo-user-repository.ts`
```typescript
export class MongoUserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return UserModel.findOne({ email }).exec();
  }
  // ... other methods
}
```

### 4.3 Key Domain Interfaces

Understanding these ports is critical:

#### Repository Ports (`backend/src/domain/ports/`)
| Interface | Purpose |
|-----------|---------|
| `IUserRepository` | User CRUD operations |
| `IAgentRepository` | Agent CRUD operations |
| `IConversationRepository` | Conversation CRUD operations |
| `IToolRepository` | Custom tool CRUD operations |
| `IBillingRepository` | Billing account operations |
| `ICouponRepository` | Coupon operations |

#### Service Ports (`backend/src/domain/ports/`)
| Interface | Purpose |
|-----------|---------|
| `ILLMProvider` | LLM text generation + streaming |
| `IToolExecutor` | Executes tools (memory, RAG, custom) |
| `IPasswordHasher` | Password hashing/comparison |
| `ITokenService` | JWT generation/verification |
| `IEmailService` | Email sending |

#### Domain Models (`backend/src/domain/models/`)
| Model | Fields |
|-------|--------|
| `IAgent` | `agentId`, `ownerId`, `name`, `instructions`, `tools`, `memoryEnabled`, `ragEnabled` |
| `IConversation` | `conversationId`, `agentId`, `userId`, `messages[]` |
| `IMessage` | `role`, `content`, `timestamp`, `toolCalls[]`, `metadata` |
| `ITool` | `toolId`, `userId`, `name`, `url`, `method`, `headers`, `apiSchema` |
| `IBillingAccount` | `userId`, `tier`, `cuBalance`, `grantedCuBalance`, `totalCuUsed` |

#### Error Classes (`backend/src/domain/errors/`)
All errors extend `DomainError` and map to HTTP status codes:

| Error Class | Status Code | Usage |
|------------|-------------|-------|
| `UnauthorizedError` | 401 | Invalid credentials, not logged in |
| `NotFoundError` | 404 | Resource doesn't exist |
| `InsufficientBalanceError` | 402 | Not enough CU balance |
| `ValidationError` | 400 | Invalid input (Zod failures) |
| `ConflictError` | 409 | Duplicate resource |
| `LLMProviderError` | 500 | LLM API failures |
| `ToolExecutionError` | 500 | Tool execution failures |

---

## 5. Backend Deep Dive

### 5.1 Dependency Injection Container

The `DIContainer` is the heart of the backend. All dependencies are statically defined here.

**File**: `backend/src/infrastructure/di/container.ts`

Key sections:

```typescript
export class DIContainer {
  // ========== REPOSITORIES ==========
  static readonly userRepo = new MongoUserRepository();
  static readonly agentRepo = new MongoAgentRepository();
  static readonly convoRepo = new MongoConversationRepository();
  // ... more repos

  // ========== ADAPTERS ==========
  static readonly passwordHasher = new BcryptPasswordHasher();
  static readonly tokenService = new JwtTokenService();
  static readonly emailService = new NodemailerAdapter();

  // ========== LLM & VECTOR STORE ==========
  static readonly llmProvider = DIContainer.getVercelAiAdapter();
  static readonly embeddingProvider = new OllamaEmbeddingAdapter(env.OLLAMA_URL);
  static readonly vectorStore = new QdrantAdapter(env.VECTOR_DB_URL);

  // ========== USE CASES ==========
  static readonly loginUser = new LoginUserUseCase(
    this.userRepo,
    this.passwordHasher,
    this.tokenService,
  );
  // ... 40+ more use cases

  // ========== SERVICES ==========
  static readonly orchestrator = new AgentOrchestratorService(
    this.llmProvider,
    this.toolExecutor,
    this.logger,
  );
}
```

**To add a new use case**:
1. Create the use case class in `application/use-cases/`
2. Register it in the container with its dependencies
3. Inject it in the controller

### 5.2 Agent Orchestrator (Core LLM Loop)

**File**: `backend/src/application/services/agent-orchestrator.ts`

This is where the magic happens - the agent's ability to use tools:

```typescript
async *runStream(messages, tools, systemInstruction, context) {
  // Step 1: Bind tools to LLM
  this.llmProvider.bindTools(tools);

  // Step 2: Loop up to 5 times (tool use + response)
  for (let i = 0; i < 5; i++) {
    // Call LLM
    const stream = this.llmProvider.streamText(currentMessages, tools);

    // Collect response chunks
    for await (const chunk of stream) {
      yield { content: chunk.content };
    }

    // If LLM called tools, execute them
    if (hasToolCalls) {
      for (const toolCall of response.toolCalls) {
        const result = await this.toolExecutor.execute(toolCall, context);
        // Add tool result back to messages for next LLM call
        currentMessages.push(toolResult);
      }
      continue; // Loop again with tool results
    }

    // No tools called - return final response
    return;
  }
}
```

### 5.3 Tool Executor (Built-in Tools)

**File**: `backend/src/infrastructure/adapters/tools/tool-executor.ts`

The tool executor handles:

1. **Memory Tools** - `get_memory`, `save_memory`
2. **RAG Tools** - `search_knowledge_base`
3. **Custom Tools** - User-defined HTTP APIs

```typescript
async execute(toolCall, context) {
  switch (toolCall.name) {
    case 'get_memory':
      return this.memoryService.getMemories(context.agentId);
    case 'save_memory':
      return this.memoryService.saveMemory(context, toolCall.input);
    case 'search_knowledge_base':
      return this.ragService.search(context.agentId, toolCall.input.query);
    default:
      // Custom tool - make HTTP request
      return this.executeCustomTool(toolCall, context);
  }
}
```

### 5.4 Creating a New API Endpoint

Here's a complete example - adding an endpoint to list public agents:

#### Step 1: Create the Use Case
**File**: `backend/src/application/use-cases/get-discover-agents.ts`

```typescript
import { IAgentRepository } from '../../domain/ports';
import { IAgent } from '../../domain/models';

export class GetDiscoverAgentsUseCase {
  constructor(private agentRepo: IAgentRepository) {}

  async execute(limit = 20, offset = 0): Promise<IAgent[]> {
    return this.agentRepo.findPublic(limit, offset);
  }
}
```

#### Step 2: Register in DI Container
**File**: `backend/src/infrastructure/di/container.ts`

```typescript
import { GetDiscoverAgentsUseCase } from '../../application/use-cases';

// Add to use cases section:
static readonly getDiscoverAgents = new GetDiscoverAgentsUseCase(this.agentRepo);
```

#### Step 3: Create Controller Method
**File**: `backend/src/presentation/agents/controller.ts`

```typescript
async discover(req, res, next) {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const agents = await DIContainer.getDiscoverAgents.execute(
      Number(limit),
      Number(offset),
    );
    res.json(agents);
  } catch (error) {
    next(error);
  }
}
```

#### Step 4: Add Route
**File**: `backend/src/presentation/agents/router.ts`

```typescript
router.get('/discover', controller.discover);
```

#### Step 5: Add Input Validation (Optional)
**File**: `backend/src/presentation/agents/dto.ts`

```typescript
export const discoverAgentsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});
```

### 5.5 Middleware Stack

**File**: `backend/src/presentation/app.ts`

```typescript
const app = express();

// Security
app.use(cors({ origin: config.ALLOWED_ORIGINS }));
app.use(helmet());
app.use(rateLimiter);  // Global rate limit

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// File uploads
app.use(multer().single('file'));

// Auth (all /api routes)
app.use('/api', authMiddleware.authenticate);

// Routes
app.use('/api/auth', authRouter);
app.use('/api/agents', agentRouter);
app.use('/api/conversations', conversationRouter);
// ...

// Error handling
app.use(ErrorMiddleware.handleError);
```

---

## 6. Frontend Deep Dive

### 6.1 API Client

**File**: `frontend/src/api/client.ts`

The axios instance handles:

1. **Base URL** - From `VITE_API_URL` env var
2. **Token injection** - Automatically adds Bearer token
3. **401 handling** - Redirects to login on auth failure
4. **Retry logic** - Exponential backoff for 5xx errors

```typescript
// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('blueprints_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('blueprints_token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  },
);
```

### 6.2 Service Layer Pattern

Each API module follows the same pattern:

**File**: `frontend/src/api/auth.ts`

```typescript
// Raw API functions
export const loginApi = (data: LoginDto) => 
  apiClient.post<{ token: string; userId: string }>('/auth/login', data);

export const registerApi = (data: RegisterDto) => 
  apiClient.post('/auth/register', data);

// React Query hooks (preferred)
export const useLogin = () => 
  useMutation({ mutationFn: loginApi });

export const useCurrentUser = () =>
  useQuery({
    queryKey: ['current-user'],
    queryFn: () => apiClient.get('/auth/me'),
  });
```

### 6.3 Authentication Flow

**File**: `frontend/src/hooks/use-auth.tsx`

```typescript
// On login
const login = async (credentials) => {
  const { data } = await loginApi(credentials);
  localStorage.setItem('blueprints_token', data.token);
  queryClient.invalidateQueries(['current-user']);
  navigate('/agents');
};

// On logout
const logout = () => {
  localStorage.removeItem('blueprints_token');
  queryClient.clear();
  navigate('/auth/login');
};

// On app load - validate token
useEffect(() => {
  const token = localStorage.getItem('blueprints_token');
  if (token) {
    queryClient.fetchQuery(['current-user']).then(/* set user */);
  }
}, []);
```

### 6.4 TanStack Router (File-Based Routing)

Routes are defined with file-based routing:

```
frontend/src/routes/
├── __root.tsx              # Root layout (sidebar, outlets)
├── index.tsx              # Landing page (/)
├── auth/
│   ├── login.tsx          # /auth/login
│   ├── register.tsx      # /auth/register
│   └── forgot-password.tsx
├── agents/
│   ├── index.tsx          # /agents (my agents)
│   └── $agentId.tsx      # /agents/:agentId
├── chat/
│   ├── $conversationId.tsx  # /chat/:conversationId
│   └── new/$agentId.tsx     # /chat/new/:agentId
└── settings.tsx           # /settings
```

**Creating a new route**:

1. Create file: `frontend/src/routes/tools/index.tsx`
2. Use `createFileRoute`:

```typescript
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/tools')({
  component: ToolsPage,
});

function ToolsPage() {
  return <div>Tools Page</div>;
}
```

### 6.5 React Query Patterns

```typescript
// Fetch data (auto-cached, refetch on window focus)
const { data, isLoading, error } = useQuery({
  queryKey: ['agents', agentId],
  queryFn: () => agentsApi.getById(agentId),
});

// Mutations (with loading, error handling)
const { mutate, isPending } = useMutation({
  mutationFn: (data) => agentsApi.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['my-agents']);
    toast.success('Agent created!');
  },
});
```

### 6.6 Chat Streaming (SSE)

**File**: `frontend/src/hooks/use-chat-stream.ts`

The chat hook handles Server-Sent Events:

```typescript
const sendMessage = async (conversationId, message) => {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    // Parse SSE format: "data: {...}\n\n"
    const events = text.split('\n').filter(s => s.startsWith('data: '));
    for (const event of events) {
      const data = JSON.parse(event.slice(6));
      onChunk(data);
    }
  }
};
```

---

## 7. How to Add New Features

### 7.1 Adding a Backend Feature

1. **Define the domain model/port** (if needed)
   - Add interface to `domain/ports/`
   - Add model to `domain/models/`

2. **Implement the use case**
   - Create `application/use-cases/<action>-<entity>.ts`
   - Follow the pattern: constructor dependencies → execute method

3. **Register in DI Container**
   - Add to `infrastructure/di/container.ts`

4. **Create controller method**
   - Add to appropriate controller in `presentation/<feature>/controller.ts`
   - Use Zod DTO for validation

5. **Add route**
   - Register in `presentation/<feature>/router.ts`

6. **Add tests** (optional but recommended)
   - Create `use-cases/<name>.spec.ts`

### 7.2 Adding a Frontend Feature

1. **Add API client**
   - Create or extend `api/<feature>.ts`
   - Export raw API functions and React Query hooks

2. **Add route**
   - Create `routes/<feature>/index.tsx` or `$param.tsx`

3. **Add component**
   - Create in `components/<feature>/`
   - Reuse UI primitives from `components/ui/`

4. **Wire up navigation** (if needed)
   - Add link in `__root.tsx` sidebar

### 7.3 End-to-End Feature Example

Let's add a "featured agents" endpoint:

#### Backend
```typescript
// 1. Use case: application/use-cases/get-featured-agents.ts
export class GetFeaturedAgentsUseCase {
  constructor(private agentRepo: IAgentRepository) {}
  async execute(): Promise<IAgent[]> {
    return this.agentRepo.findFeatured();
  }
}

// 2. Register: infrastructure/di/container.ts
static readonly getFeaturedAgents = new GetFeaturedAgentsUseCase(this.agentRepo);

// 3. Controller: presentation/agents/controller.ts
async getFeatured(req, res, next) {
  const agents = await DIContainer.getFeaturedAgents.execute();
  res.json(agents);
}

// 4. Route: presentation/agents/router.ts
router.get('/featured', controller.getFeatured);
```

#### Frontend
```typescript
// 1. API: api/agents.ts
export const fetchFeaturedAgents = () => apiClient.get('/agents/featured');

export const useFeaturedAgents = () => 
  useQuery({ queryKey: ['featured-agents'], queryFn: fetchFeaturedAgents });

// 2. Route: routes/discover.tsx
import { useFeaturedAgents } from '@/api/agents';

function DiscoverPage() {
  const { data: featured } = useFeaturedAgents();
  return (
    <div>
      <h1>Featured Agents</h1>
      {featured?.map(agent => <AgentCard key={agent.agentId} agent={agent} />)}
    </div>
  );
}
```

---

## 8. Running & Testing

### 8.1 Development Commands

```bash
# From root (monorepo)
yarn dev                # Run both frontend + backend
yarn build              # Build both workspaces
yarn lint               # Lint both workspaces
yarn test               # Test both workspaces

# Backend only
cd backend
yarn dev                # tsx hot reload
yarn build              # tsc + tsc-alias
yarn lint               # eslint
yarn format             # prettier
yarn test               # jest
yarn test:watch         # jest watch mode
npx tsc --noEmit       # Type-check only

# Frontend only
cd frontend
yarn dev                # Vite hot reload
yarn build             # vite build + tsc -b
yarn lint              # eslint
npx tsc --noEmit       # Type-check only
```

### 8.2 Testing

```bash
# Run all backend tests
cd backend && yarn test

# Run specific test file
cd backend && yarn test path/to/file.spec.ts

# Run tests matching pattern
cd backend && yarn test --testNamePattern="Login"
```

### 8.3 API Testing with cURL

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}'

# Create Agent (with token)
curl -X POST http://localhost:3000/api/agents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Agent","instructions":"You are helpful"}'

# List my agents
curl http://localhost:3000/api/agents/my \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send chat message (SSE)
curl -X POST http://localhost:3000/api/conversations/CONVO_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
```

---

## 9. Code Style Guidelines

### 9.1 File Naming

| Type | Convention | Example |
|------|------------|---------|
| TypeScript files | kebab-case | `chat-with-agent.ts` |
| React components | PascalCase | `CreateAgentForm.tsx` |
| Test files | `.spec.ts` | `login-user.spec.ts` |

### 9.2 Class & Interface Naming

| Type | Convention | Example |
|------|------------|---------|
| Classes | PascalCase | `LoginUserUseCase` |
| Interfaces | I-prefix | `IUserRepository` |
| Enums | PascalCase | `MessageRole` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |

### 9.3 Import Conventions

**Backend** (use `@/` alias):
```typescript
import { logger } from '@/infrastructure/utils/logger';
import { IUserRepository } from '@/domain/ports';
```

**Frontend** (use relative or `@/` alias):
```typescript
import { useLogin } from '@/api/auth';
import { Button } from '@/components/ui/button';
```

### 9.4 Validation

All input DTOs must use Zod schemas:

```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  rememberMe: z.boolean().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
```

### 9.5 Error Handling

**Controllers**: Always use try/catch with `next(error)`:
```typescript
async myEndpoint(req, res, next) {
  try {
    const result = await DIContainer.myUseCase.execute(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}
```

**Use Cases**: Throw domain errors:
```typescript
if (!user) {
  throw new NotFoundError('User not found');
}
```

### 9.6 What to Avoid

- ❌ `any` types (use proper interfaces)
- ❌ `// eslint-disable` comments (fix the issue)
- ❌ Committing `.env` files
- ❌ Using WebSocket (use SSE for streaming)
- ❌ Skipping Zod validation on inputs
- ❌ Adding `border-radius` (brutalist design: `border-radius: 0 !important`)

---

## 10. Known Issues for Contributors

### 10.1 High Priority (Production Concerns)

| Issue | Location | Impact | Recommendation |
|-------|----------|--------|----------------|
| In-memory rate limiting | `auth/router.ts:18-32` | Lost on restart, fails in multi-instance | Use Redis-based rate limiting |
| Frontend `any` types | `api/*.ts` | Poor type safety | Define proper interfaces |
| Memory leak in chat | `hooks/use-chat-stream.ts` | SSE reader not cleaned up | Add AbortController cleanup |
| Token in localStorage | `api/client.ts` | Vulnerable to XSS | Consider httpOnly cookies |

### 10.2 Medium Priority

| Issue | Recommendation |
|-------|----------------|
| No pagination on list endpoints | Add `limit`/`offset` to all list APIs |
| Missing DB indexes | Add compound indexes for common queries |
| Magic numbers | Extract to constants (orchestrator iterations, rate limits) |

### 10.3 Good First Issues

- Add pagination to `list-conversations` endpoint
- Extract magic numbers to `backend/src/domain/configs/`
- Clean up unused imports in adapter files
- Add loading states to admin panel mutations
- Add error boundaries to route components

---

## Quick Reference Card

### Common Commands
```bash
yarn dev              # Start both
cd backend && yarn dev   # Backend only
cd frontend && yarn dev  # Frontend only
yarn build            # Build all
yarn lint             # Lint all
```

### Key Files
| Purpose | File |
|---------|------|
| DI Container | `backend/src/infrastructure/di/container.ts` |
| Express Setup | `backend/src/presentation/app.ts` |
| Agent Orchestrator | `backend/src/application/services/agent-orchestrator.ts` |
| API Client | `frontend/src/api/client.ts` |
| Root Layout | `frontend/src/routes/__root.tsx` |

### Architecture Layers
```
Presentation → Application → Domain → Infrastructure
  (routes)     (use cases)   (ports)    (adapters)
```

---

## Questions?

- Check **README.md** for system design overview
- Check **AGENTS.md** for detailed technical specs
- Review existing use cases/controllers as templates
- Ask in issues or discussions

Happy contributing! 🚀
