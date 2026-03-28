# AGENTS.md - AI Agent Instructions for b8s (Blueprints)

## Project Overview

Blueprints (b8s) is an AI agent orchestration platform with RAG, memory, and multi-provider LLM support. Monorepo with Yarn workspaces: `backend/` (Node.js/Express/TypeScript) and `frontend/` (React/Vite/TypeScript).

## Build / Lint / Test Commands

```bash
# From root
yarn build              # Build both workspaces
yarn lint               # Lint both workspaces
yarn dev                # Dev mode for both

# Backend only
cd backend
yarn dev                # tsx watch src/index.ts
yarn build              # tsc && tsc-alias
yarn lint               # eslint "src/**/*.ts"
yarn lint:fix           # eslint --fix
yarn format             # prettier --write "src/**/*.ts"
yarn test               # jest (single: npx jest path/to/file.spec.ts)
npx tsc --noEmit        # Type-check only

# Frontend only
cd frontend
yarn dev                # vite
yarn build              # vite build && tsc -b
yarn lint               # eslint .
npx tsc --noEmit        # Type-check only
```

## Architecture

Backend follows **Clean/Hexagonal Architecture**:

```
src/
  domain/       # Interfaces, models, errors, ports (pure logic)
  application/  # Use cases (ChatWithAgentUseCase), orchestrator
  infrastructure/ # Adapters, DB, LLM, queue, configs, DI container
  presentation/ # Express controllers, routes, DTOs, middleware
```

Key files:
- `infrastructure/di/container.ts` - Static DI container with all dependencies
- `presentation/*/controller.ts` - HTTP handlers (class-based)
- `application/use-cases/*.ts` - Business logic (classes with `execute()`)
- `domain/ports/*.ts` - Interface contracts

## Code Style

### Imports
- Backend: Use `@/` alias for `src/` (e.g., `import { logger } from '@/infrastructure/utils/logger'`)
- Relative imports also acceptable within same module
- Barrel exports via `index.ts` files in each layer

### Naming
- Files: **kebab-case** (`chat-with-agent.ts`, `create-agent-form.tsx`)
- Classes: **PascalCase** (`ChatWithAgentUseCase`, `MongoAgentRepository`)
- Interfaces: **I-prefix** (`IAgent`, `ILLMProvider`, `IRepository`)
- Enums: **PascalCase** (`MessageRole`, `JobStatus`)
- Constants: **UPPER_SNAKE_CASE** (`BASE_SYSTEM_PROMPT`)
- Use cases: `<Action><Entity>UseCase` pattern

### TypeScript
- Strict mode enabled with all flags (noUncheckedIndexedAccess, exactOptionalPropertyTypes, etc.)
- Use `zod` for runtime validation (env, DTOs)
- Prefer `interface` over `type` for object shapes
- Enums for domain constants, not string unions
- `async/await` over raw promises

### Formatting (Prettier)
- Semicolons: yes
- Single quotes
- Trailing commas: all
- Print width: 100
- Tab width: 2

### Error Handling
- Controllers: try/catch, call `next(error)` on failure
- Use domain error classes: `NotFoundError`, `UnauthorizedError`, `LLMProviderError`
- All errors extend `DomainError` base class
- Error middleware maps errors to HTTP status codes

## Docker

```bash
docker compose up -d --build   # Start all services
docker compose down            # Stop all
```

Services: app (3000), frontend (3001), mongodb (27018), qdrant (6333), redis (6380), ollama (11435)

## CI/CD

GitHub Actions on push/PR to main:
1. Type-check both workspaces (`tsc --noEmit`)
2. Build & push Docker images to Docker Hub
3. Deploy to EC2 Docker Swarm via SSH

## Important Patterns

- **Streaming**: SSE via Express (not WebSocket). `res.write('data: ...\n\n')`
- **DI**: Static class `DIContainer` with readonly properties (no framework)
- **Queue**: BullMQ + Redis for async jobs (document ingestion)
- **Vector DB**: Qdrant for RAG embeddings and memory
- **LLM**: Vercel AI SDK with DeepSeek, Gemini, Ollama providers

## Do Not

- Don't use WebSocket for streaming (use SSE)
- Don't skip Zod validation on inputs
- Don't use `any` without eslint-disable comment
- Don't commit `.env` files
- Don't change border-radius (brutalist design: `border-radius: 0 !important`)
