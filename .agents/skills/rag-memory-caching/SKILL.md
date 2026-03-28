---
name: rag-memory-caching
description: Provides structured knowledge and best practices for designing production-grade AI systems using Retrieval-Augmented Generation (RAG), agent memory architectures, and multi-layer caching strategies. Use this skill whenever the user mentions RAG, vector search, retrieval pipelines, agent memory, embedding caching, semantic cache, long-term memory, LLM context management, hallucination reduction, or wants to design, debug, or optimize any LLM-powered system. Also trigger when users ask about chunking strategies, reranking, hybrid search, session vs persistent memory, or cost/latency optimization for AI agents.
---

# RAG, Memory Systems, and Agent Caching

A reference skill for designing scalable, production-grade AI systems. Use the sections below based on what the user needs: retrieval quality → RAG, persistence/personalization → Memory, performance/cost → Caching.

---

## 1. RAG (Retrieval-Augmented Generation)

**Purpose:** Retrieve external knowledge and inject it into model context to improve accuracy and grounding.

**Pipeline:**
```
Query → Retrieval → Reranking → Context Assembly → Generation
```

### RAG Types

| Type | When to Use |
|---|---|
| Vanilla RAG | Simple prototypes, single-domain corpora |
| Hybrid RAG | Production — combines vector + keyword + filters |
| Multi-hop RAG | Complex queries requiring iterative retrieval |
| Agentic RAG | LLM decides retrieval strategy dynamically |
| Graph RAG | Entity-relationship traversal (knowledge graphs) |
| Structured RAG | SQL / API-based retrieval over structured data |

### Key Components

- **Chunking** — respect semantic boundaries; use overlap (e.g. 20%)
- **Embeddings** — vector representation of chunks and queries
- **Retriever** — vector search, BM25, or hybrid
- **Reranker** — cross-encoder or LLM-based for precision
- **Context Builder** — assembles minimal, relevant context

### Design Rules

- Prefer **hybrid retrieval** in production (vector + BM25)
- Always apply a **reranker** when precision matters
- Keep injected context **minimal and relevant** — trim aggressively
- **Version** both embeddings and source documents

### Implementation Checklist

- [ ] Hybrid retrieval configured
- [ ] Reranker in place
- [ ] Chunking respects semantic boundaries
- [ ] Metadata filtering enabled

---

## 2. Memory Systems

**Purpose:** Persist agent state, user data, and past interactions across time.

### Memory Types

| Type | Storage | Contents |
|---|---|---|
| Short-Term | Context window | Recent messages |
| Long-Term | DB / vector store | Persistent user data |
| Episodic | Event log | Actions and outcomes |
| Semantic | Knowledge store | Facts and domain knowledge |
| Procedural | Tool registry | Workflows and capabilities |
| Working | Scratchpad | Temporary reasoning state |

### Recommended Architecture

```
Recent Context
  → Session Summary
  → Structured Memory (Postgres)
  → Vector Memory (Qdrant / Pinecone)
```

### Storage Mapping

| Store | Use For |
|---|---|
| Redis | Session state + cache |
| Postgres | Structured / relational data |
| Vector DB | Semantic recall |

### Memory Lifecycle

```
Observe → Extract → Score → Store → Summarize → Retrieve → Expire
```

### Scoring Signals (for importance-based retention)

- Recency
- Importance (explicit or inferred)
- Frequency of access
- Relevance to current task
- Time decay

### Design Rules

- **Separate session memory from persistent memory**
- Summarize long conversation histories before archiving
- Apply **TTL** to temporary or session-scoped data
- Avoid storing low-signal noise

### Implementation Checklist

- [ ] Session vs long-term memory separated
- [ ] Summarization pipeline active for long histories
- [ ] TTL policies defined
- [ ] Importance scoring in place

---

## 3. Agent Caching Strategies

**Purpose:** Reduce cost, latency, and redundant computation.

### Cache Layers (in order of lookup)

1. **Response Cache** — Final LLM answers
2. **Retrieval Cache** — Retrieved document sets
3. **Embedding Cache** — Precomputed vector embeddings
4. **Tool Cache** — External API / DB call results
5. **Prompt Cache** — Assembled context bundles
6. **Session Cache** — Short-lived agent state

### Cache Key Design

Always hash all variables that affect the output:

```
key = hash(query + user_id + model + prompt_version + filters)
```

### Invalidation Strategies

| Strategy | When to Use |
|---|---|
| TTL-based | General-purpose default |
| Event-based | On data change (webhooks, triggers) |
| Version-based | After model or prompt updates |
| Dependency-based | Track source documents explicitly |

### Semantic Cache

For fuzzy cache hits — use embeddings to match similar (not identical) queries.

**Example:** "Reset password" and "Forgot password" → same cached response.

### When NOT to Cache

- Real-time or streaming data
- Frequently changing data (prices, live scores)
- Sensitive or user-specific personalized results

### Implementation Checklist

- [ ] Multi-layer cache hierarchy in place
- [ ] Cache keys versioned (include model/prompt version)
- [ ] Invalidation strategy defined per layer
- [ ] Cache hit/miss metrics instrumented

---

## Combined System Flow

```
User Query
  → Response Cache (hit? return early)
  → Session Memory (load context)
  → Long-Term Memory (retrieve relevant history)
  → RAG Retrieval (fetch external knowledge)
  → Reranking (precision filter)
  → LLM Generation
  → Store to Memory
  → Update Cache
```

---

## Reference Architecture

```
Client
  → API Gateway
  → Agent Orchestrator
      ├── Cache Layer     (Redis)
      ├── Memory Layer    (Redis + Postgres + Vector DB)
      ├── Retrieval Layer (Hybrid Search + Reranker)
      ├── Tool Layer      (APIs, Functions)
      └── LLM
```

---

## Design Principles

| Concern | Solution |
|---|---|
| External knowledge / grounding | RAG |
| Persistence / personalization | Memory |
| Performance / cost reduction | Caching |

---

## Output Guidelines

When advising or implementing using this skill:

- Prefer **precise, minimal context** — never stuff the window
- Avoid **redundant retrieval** — check retrieval cache first
- **Reuse cached results** when TTL and version are valid
- Store only **high-signal memories** — apply importance scoring
- Choose retrieval strategy based on **query complexity** (vanilla → hybrid → multi-hop → agentic)