# Blueprints (b8s)

Blueprints (b8s) is an advanced AI agent orchestration platform designed to seamlessly handle complex generative AI workflows, Retrieval-Augmented Generation (RAG), and multi-provider LLM integrations with a premium user experience.

## Features

- **Multi-Provider LLM Integration:** Full support for DeepSeek, Google Generative AI (Gemini), and local Ollama models powered by the Vercel AI SDK.
- **Advanced Retrieval-Augmented Generation (RAG):** Automated PDF file ingestion, chunking, and embedding generation stored dynamically in Qdrant vector database.
- **LLM Prompt Caching:** Advanced application-level response caching, strict message history windowing, and DeepSeek prefix caching to reduce token usage and improve latency.
- **Usage Tracking and Billing:** Granular tracking of Compute Units (CUs) per agent interaction, complete with free-tier coupon logic.
- **Premium User Interface:** A highly polished, responsive dashboard built with React 19, Tailwind CSS, shadcn/ui, TanStack Router, and Framer Motion.
- **Robust Monorepo Architecture:** Clean decoupling between a Node.js/Express backend and a Vite/React frontend, fully typed with TypeScript.
- **Automated Deployments:** Containerized via Docker and orchestrated on AWS EC2 via Docker Swarm with zero-downtime CI/CD rolling updates natively integrated with GitHub Actions.

## Tech Stack

### Frontend

- React 19 & Vite
- TypeScript
- TanStack Router & Query
- Tailwind CSS & shadcn/ui
- Framer Motion
- Lucide React

### Backend

- Node.js & Express
- TypeScript
- Vercel AI SDK
- MongoDB & Mongoose
- Qdrant Vector Database
- JWT Authentication

## Getting Started

### Prerequisites

- Node.js 22+
- Yarn
- Docker & Docker Compose
- MongoDB (Local or Atlas URIs)
- Qdrant (Local or Cloud)
- API Keys for necessary LLM Providers (Google Gemini, DeepSeek, etc.)

### Installation

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/mahmoudalnkeeb/b8s.git
cd b8s
yarn install
```

2. Environment Variables:
   Copy `.env.example` to `.env` in the root directory and fill out the required credentials.

```bash
cp .env.example .env
```

3. Start the Development Servers:

```bash
# Terminal 1 - Start the backend
cd backend
yarn dev

# Terminal 2 - Start the frontend
cd frontend
yarn dev
```

## Deployment

Blueprints (b8s) is ready to deploy on any Docker environment. For production, the platform utilizes Docker Swarm via a GitHub Actions CI/CD pipeline.

To start manually with Docker Compose:

```bash
docker compose up -d --build
```

## License

This project is licensed under the **Sustainable Use License** (Fair Code).

You are free to use, modify, and distribute the software for internal, personal, or educational purposes. However, you are **not** permitted to offer Blueprints (b8s) as a commercial managed service or an API-based commercial offering without obtaining a separate enterprise license. Please refer to the full license terms for exact details.
