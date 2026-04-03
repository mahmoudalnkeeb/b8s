# Blueprints (b8s)

Blueprints (b8s) is an advanced AI agent orchestration platform designed to seamlessly handle complex generative AI workflows, Retrieval-Augmented Generation (RAG), and multi-provider LLM integrations with a premium user experience.

## Features

* **Multi-Provider LLM Integration:** Full support for DeepSeek, Google Generative AI (Gemini), and local Ollama models powered by the Vercel AI SDK.
* **Advanced Retrieval-Augmented Generation (RAG):** Automated PDF file ingestion, chunking, and embedding generation stored dynamically in Qdrant vector database.
* **LLM Prompt Caching:** Advanced application-level response caching, strict message history windowing, and DeepSeek prefix caching to reduce token usage and improve latency.
* **Usage Tracking and Billing:** Granular tracking of Compute Units (CUs) per agent interaction, complete with free-tier coupon logic.
* **Premium User Interface:** A highly polished, responsive dashboard built with React 19, Tailwind CSS, shadcn/ui, TanStack Router, and Framer Motion.
* **Robust Monorepo Architecture:** Clean decoupling between a Node.js/Express backend and a Vite/React frontend, fully typed with TypeScript.
* **Automated Deployments:** Containerized via Docker and orchestrated on AWS EC2 via Docker Swarm with zero-downtime CI/CD rolling updates natively integrated with GitHub Actions.

## Tech Stack

### Frontend

* React 19 & Vite
* TypeScript
* TanStack Router & Query
* Tailwind CSS & shadcn/ui
* Framer Motion
* Lucide React

### Backend

* Node.js & Express
* TypeScript
* Vercel AI SDK
* MongoDB & Mongoose
* Qdrant Vector Database
* BullMQ & Redis (Job Queue)
* JWT Authentication

## Prerequisites

Before running the project, ensure you have the following installed:

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | v22+ | Runtime environment |
| **Yarn** | Latest | Package manager (monorepo workspaces) |
| **Docker** | Latest | Container runtime |
| **Docker Compose** | Latest | Multi-container orchestration |

### Required API Keys

* **Google Gemini API Key** - For Gemini model access
* **DeepSeek API Key** - For DeepSeek model access

> **Note:** MongoDB, Qdrant, Redis, and Ollama are included in the Docker Compose setup and do not require separate installation.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/mahmoudalnakeeb/b8s.git
cd b8s
```

### 2. Install Dependencies

```bash
yarn install
```

### 3. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3000
NODE_ENV=development

# Authentication
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=24h

# MongoDB (Docker mapped port)
MONGODB_URI=mongodb://localhost:27018/b8s

# Qdrant Vector DB
VECTOR_DB_TYPE=qdrant
VECTOR_DB_URL=http://localhost:6333

# Ollama (Local LLM)
OLLAMA_URL=http://localhost:11434

# LLM Providers
GEMINI_API_KEY=your-gemini-api-key
GENAI_MODEL=gemini-2.5-flash
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat

# Embedding Model
EMBEDDING_MODEL=nomic-embed-text-v2-moe
```

### 4. Start with Docker Compose (Recommended)

This starts all infrastructure services (MongoDB, Qdrant, Redis, Ollama) plus the application:

```bash
docker compose up -d --build
```

Services will be available at:

| Service | URL |
|---------|-----|
| Backend API | `http://localhost:3000` |
| Frontend | `http://localhost:3001` |
| MongoDB | `localhost:27018` |
| Qdrant Dashboard | `http://localhost:6333/dashboard` |
| Redis | `localhost:6380` |
| Ollama | `http://localhost:11435` |

### 5. Start Development Servers (Without Docker)

If you prefer running only the app services locally while using Docker for infrastructure:

```bash
# Start infrastructure services only
docker compose up -d mongodb qdrant redis ollama

# Terminal 1 - Backend
cd backend
yarn dev

# Terminal 2 - Frontend
cd frontend
yarn dev
```

## Project Architecture

### Monorepo Structure

```
b8s/
├── backend/              # Node.js/Express API server
│   └── src/
│       ├── domain/           # Core business logic & interfaces
│       │   ├── errors/       # Domain error classes
│       │   ├── models/       # TypeScript interfaces & types
│       │   ├── ports/        # Repository & service contracts
│       │   └── services/     # Domain service interfaces
│       ├── application/      # Use cases & orchestration
│       │   ├── services/     # Application service implementations
│       │   └── use-cases/    # Business use cases (ChatWithAgent, etc.)
│       ├── infrastructure/   # External integrations & adapters
│       │   ├── adapters/     # Port implementations (repos, services)
│       │   ├── configs/      # App configuration
│       │   ├── db/           # MongoDB connection & models
│       │   ├── di/           # Dependency injection container
│       │   ├── external-services/  # LLM, Qdrant, Redis clients
│       │   ├── queue/        # BullMQ job queue setup
│       │   └── utils/        # Logger, helpers
│       └── presentation/     # HTTP layer
│           ├── agents/       # Agent CRUD endpoints
│           ├── auth/         # Authentication endpoints
│           ├── billing/      # Usage & billing endpoints
│           ├── conversations/ # Chat conversation endpoints
│           ├── feedback/     # User feedback endpoints
│           ├── tools/        # Agent tools endpoints
│           └── middlewares/   # Auth, error handling, rate limiting
│
├── frontend/             # React/Vite SPA
│   └── src/
│       ├── api/              # Axios API client modules
│       ├── components/       # React components
│       │   ├── agents/       # Agent management UI
│       │   └── ui/           # shadcn/ui primitives
│       ├── hooks/            # Custom React hooks
│       ├── lib/              # Utilities & helpers
│       └── routes/           # TanStack Router file-based routes
│
├── compose.yml           # Docker Compose configuration
├── ec2-nginx.conf        # Nginx reverse proxy config
└── .github/workflows/    # CI/CD pipeline
```

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│   (Controllers, Routes, Middleware)     │
├─────────────────────────────────────────┤
│          Application Layer              │
│     (Use Cases, App Services)           │
├─────────────────────────────────────────┤
│            Domain Layer                 │
│  (Models, Ports, Errors, Domain Svc)   │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│  (DB, LLM, Queue, External Services)   │
└─────────────────────────────────────────┘
```

* **Dependency Rule:** Inner layers never import from outer layers
* **Ports & Adapters:** Domain defines interfaces (`ports/`), Infrastructure implements them (`adapters/`)
* **DI Container:** `infrastructure/di/container.ts` wires all dependencies

## System Design

### High-Level Architecture

```
                          ┌──────────────┐
                          │   Nginx      │
                          │  (Reverse    │
                          │   Proxy)     │
                          └──────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────┴──────┐           ┌──────┴──────┐
              │  Frontend  │           │   Backend   │
              │  (React)   │◄─────────►│  (Express)  │
              │  Port 3001 │           │  Port 3000  │
              └────────────┘           └──────┬──────┘
                                              │
                         ┌────────────┬───────┴──────┬────────────┐
                         │            │              │            │
                   ┌─────┴─────┐ ┌────┴────┐  ┌──────┴─────┐ ┌────┴────┐
                   │ MongoDB   │ │ Qdrant  │  │   Redis    │ │ Ollama  │
                   │ (Primary  │ │(Vector  │  │  (Queue    │ │ (Local  │
                   │   DB)     │ │   DB)   │  │   Store)   │ │  LLM)   │
                   └───────────┘ └─────────┘  └────────────┘ └─────────┘
```

### Component Responsibilities

| Component | Role |
|-----------|------|
| **Frontend** | User interface, agent management, chat interface |
| **Backend API** | Business logic, authentication, orchestration |
| **MongoDB** | Primary data store (users, agents, conversations) |
| **Qdrant** | Vector storage for RAG embeddings & memory |
| **Redis** | BullMQ job queue backend for async document processing |
| **Ollama** | Local LLM inference & embedding generation |
| **Nginx** | Reverse proxy, SSL termination, request routing |

### Data Flow: Chat with RAG

```
User Message
    │
    ▼
Backend API ──► Extract query embedding (Ollama)
    │
    ▼
Qdrant ──► Semantic search for relevant context
    │
    ▼
Backend ──► Build augmented prompt (context + message + history)
    │
    ▼
LLM Provider (Gemini/DeepSeek/Ollama) ──► Generate response (SSE stream)
    │
    ▼
MongoDB ──► Store conversation history
    │
    ▼
Client (SSE stream)
```

### Data Flow: Document Ingestion

```
User uploads PDF
    │
    ▼
Backend API ──► Save to disk, enqueue BullMQ job
    │
    ▼
Redis (BullMQ Queue)
    │
    ▼
Worker Process ──► Parse PDF ──► Chunk text
    │
    ▼
Ollama ──► Generate embeddings for each chunk
    │
    ▼
Qdrant ──► Store vectors with metadata
    │
    ▼
MongoDB ──► Update document status
```

## Deployment

### Production Architecture

The platform runs on **AWS EC2** using **Docker Swarm** for orchestration with **Nginx** as a reverse proxy. The swarm uses labeled nodes to distribute services:

- **app nodes**: Frontend and Backend API
- **db nodes**: MongoDB, Qdrant, Redis
- **ai nodes**: Ollama

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                      EC2 Swarm Manager                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Nginx Reverse Proxy (:80/:443)                     │   │
│  │  Routes: /api → app, / → frontend                    │   │
│  └─────────────────────┬───────────────────────────────┘   │
└────────────────────────┼────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  App Node     │  │  DB Node      │  │  AI Node      │
│  (app label)  │  │  (db label)   │  │  (ai label)   │
├───────────────┤  ├───────────────┤  ├───────────────┤
│ ┌───────────┐ │  │ ┌───────────┐ │  │ ┌───────────┐ │
│ │ Frontend  │ │  │ │ MongoDB   │ │  │ │  Ollama   │ │
│ │   :3001   │ │  │ │  :27017   │ │  │ │  :11434   │ │
│ └───────────┘ │  │ └───────────┘ │  │ └───────────┘ │
│ ┌───────────┐ │  │ ┌───────────┐ │  │               │
│ │  Backend  │ │  │ │  Qdrant   │ │  │               │
│ │   :3000   │ │  │ │  :6333    │ │  │               │
│ └───────────┘ │  │ └───────────┘ │  │               │
│               │  │ ┌───────────┐ │  │               │
│               │  │ │  Redis    │ │  │               │
│               │  │ │  :6379   │ │  │               │
│               │  │ └───────────┘ │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

### CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/deploy.yml`) on push to `main`:

1. **Type Check** - Runs `tsc --noEmit` for both frontend and backend
2. **Build Docker Images** - Builds and pushes to Docker Hub
3. **Deploy to Swarm** - SSH into EC2 and runs `docker stack deploy`

### Manual Deployment

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop all services
docker compose down
```

### Environment Variables (Production)

Set these as GitHub Secrets for CI/CD or in `.env` for manual deployment:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Authentication token signing key |
| `MONGODB_URI` | MongoDB connection string |
| `VECTOR_DB_URL` | Qdrant instance URL |
| `GEMINI_API_KEY` | Google Gemini API key |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password |
| `EC2_HOST` | EC2 instance IP/hostname |
| `EC2_USERNAME` | SSH username |
| `EC2_SSH_KEY` | SSH private key |

## Contributing

Contributions are welcome! To get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes following the code style guidelines in `AGENTS.md`
4. Run lint and type checks before committing:
   ```bash
   yarn lint
   npx tsc --noEmit        # backend
   cd frontend && npx tsc --noEmit
   ```
5. Commit your changes (`git commit -m "feat: add your feature"`)
6. Push to your branch (`git push origin feature/your-feature`)
7. Open a Pull Request against `main`

### Guidelines

- Follow existing code conventions (kebab-case files, PascalCase classes, `I-` prefixed interfaces)
- Use Zod for input validation
- Avoid `any` types
- Do not commit `.env` files or secrets
- Ensure `yarn lint` and `tsc --noEmit` pass in both workspaces

## License

This project is licensed under the [Sustainable Use License](./LICENSE).

You are free to use, modify, and distribute the software for internal, personal, or educational purposes. However, you are **not** permitted to offer Blueprints (b8s) as a commercial managed service or an API-based commercial offering without obtaining a separate enterprise license. See the [LICENSE](./LICENSE) file for full terms.
