<div align="center">

# 🧠 memory-lancedb-pro · Hermes Adapt

**Portable Long-Term Memory Engine for [Hermes Agent](https://github.com/TheophilusChinomona/hermes) and AI Systems**

*Give your AI agent a brain that actually remembers — across sessions, across platforms, across time.*

Forked from [CortexReach/memory-lancedb-pro](https://github.com/CortexReach/memory-lancedb-pro) (MIT License) and adapted for the Hermes Agent ecosystem with **deterministic session registry**, **cross-platform thread mapping**, and **agent-agnostic memory API**.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![LanceDB](https://img.shields.io/badge/LanceDB-Vectorstore-orange)](https://lancedb.com)
[![Hermes Adapt](https://img.shields.io/badge/Branch-hermes--adapt-blue)](https://github.com/TheophilusChinomona/memory-lancedb-pro/tree/hermes-adapt)

</div>

---

## Why This Fork Exists

Most AI agents — including the original Hermes — have **amnesia by design**. They forget everything when a session goes idle, a Discord thread times out, or a chat is resumed on a different platform.

**The core problem:** Hermes uses timestamp-based session IDs (`20260415_083927_session_id`). When a Discord thread goes idle and a new message arrives, Hermes creates a *new* session instead of resuming the old one. All context is lost.

**This fork solves it** with a **deterministic session registry** that maps platform-specific thread IDs to persistent session files:

```
discord:1493777369616355329 → session_20260416_abc123 (active, last seen 2h ago)
whatsapp:+27123456789      → session_20260415_def456 (active, last seen 1d ago)
```

Same thread = same session = no context loss. **Always.**

---

## Architecture

### Upstream Relationship

```
CortexReach/memory-lancedb-pro (master)     ← upstream (OpenClaw plugin)
         │
         │ fork + adapt
         ▼
TheophilusChinomona/memory-lancedb-pro (hermes-adapt)  ← this repo
         │
         │ adapter layer
         ▼
Hermes Agent runtime
```

**Branch strategy:**
- `master` — clean mirror of upstream, only for syncing upstream fixes
- `hermes-adapt` — all custom development lives here

**Syncing upstream updates:**
```bash
git fetch upstream
git checkout master && git merge upstream/master
git checkout hermes-adapt && git merge master
```

### Core Engine (Portable — 89% of codebase)

```
┌─────────────────────────────────────────────────────────┐
│                   index.ts (Entry Point)                │
│  Plugin Registration · Config Parsing · Lifecycle Hooks │
└────────┬──────────┬──────────┬──────────┬───────────────┘
         │          │          │          │
    ┌────▼───┐ ┌────▼───┐ ┌───▼────┐ ┌──▼──────────┐
    │ store  │ │embedder│ │retriever│ │   scopes    │
    │ .ts    │ │ .ts    │ │ .ts    │ │    .ts      │
    └────────┘ └────────┘ └────────┘ └─────────────┘
         │                     │
    ┌────▼───┐           ┌─────▼──────────┐
    │migrate │           │noise-filter.ts │
    │ .ts    │           │adaptive-       │
    └────────┘           │retrieval.ts    │
                         └────────────────┘
    ┌─────────────┐   ┌──────────┐
    │  tools.ts   │   │  cli.ts  │
    │ (Agent API) │   │ (CLI)    │
    └─────────────┘   └──────────┘
```

### Hermes Adapter Layer (New — this fork)

```
┌──────────────────────────────────────────────────────┐
│              adapters/hermes-plugin.ts                │
│  HermesMemoryEngine — unified API for Hermes Agent   │
└────────────┬────────────────────┬────────────────────┘
             │                    │
    ┌────────▼────────┐  ┌───────▼──────────────┐
    │ resolveSession()│  │ autoCapture()         │
    │                 │  │ autoRecall()          │
    │ Session Registry│  │ recall() / store()    │
    │ platform:thread │  │ forget() / update()   │
    │ → session file  │  │                       │
    └─────────────────┘  └───────────────────────┘
             │
    ┌────────▼────────────────┐
    │  ~/.hermes/             │
    │  ├── session-registry.json  │ ← deterministic ID mapping
    │  ├── memory/            │ ← LanceDB data
    │  └── sessions/          │ ← session files
    └─────────────────────────┘
```

---

## What This Engine Does

### Auto-Capture
Your agent learns from every conversation — no manual `memory_store` needed. At session end, the engine extracts preferences, decisions, facts, and entities using LLM-powered 6-category classification.

### Smart Extraction (v1.1.0)
- **6 Categories**: profile, preferences, entities, events, cases, patterns
- **L0/L1/L2 Layered Storage**: L0 (one-sentence index) → L1 (structured summary) → L2 (full narrative)
- **Two-Stage Dedup**: vector similarity pre-filter (≥0.7) → LLM semantic decision (CREATE/MERGE/SKIP)
- **Category-Aware Merge**: `profile` always merges, `events`/`cases` are append-only

### Hybrid Retrieval
```
Query → embedQuery() ─┐
                       ├─→ Hybrid Fusion → Rerank → Lifecycle Decay → Length Norm → Filter
Query → BM25 FTS ─────┘
```
- **Vector Search** — semantic similarity via LanceDB ANN (cosine distance)
- **BM25 Full-Text Search** — exact keyword matching via LanceDB FTS index
- **Cross-Encoder Reranking** — Jina, SiliconFlow, Voyage, Pinecone adapters included
- **Multi-Stage Scoring** — hybrid fusion → rerank → lifecycle decay → length norm → hard min score → MMR diversity

### Intelligent Forgetting (Weibull Decay)
- Composite score = recency + frequency + intrinsic value
- Three-tier promotion: `Peripheral ↔ Working ↔ Core`
- Access reinforcement: frequently recalled memories decay slower (spaced-repetition style)
- Importance-modulated half-life: important memories stay, noise naturally fades

### Deterministic Session Registry (New)
- Maps `platform:channelId:threadId` → persistent session file
- Survives restarts, timeouts, and cross-platform handoffs
- Touch tracking for session lifecycle management
- Dormancy detection for long-inactive sessions

### Multi-Scope Isolation
- Built-in scopes: `global`, `agent:<id>`, `custom:<name>`, `project:<id>`, `user:<id>`
- Agent-level access control
- Default: each agent accesses `global` + its own `agent:<id>` scope

---

## Agent Instructions

> **If you are an AI agent (Hermes, Claude, Codex, or any LLM-based system) reading this — these instructions are for you.**

### Core Memory Rules

1. **Recall before reasoning.** Before answering any question about past work, preferences, or decisions, ALWAYS call `recall()` first.

2. **Store after learning.** When you learn something durable (user preference, project decision, technical fact, pitfall), IMMEDIATELY store it:
   ```
   store(text="User prefers tabs for indentation", category="preference", scope="global", importance=0.8)
   ```

3. **Dual-layer storage for pitfalls.** Every bug/lesson gets TWO entries:
   - Technical: `fact` category, importance ≥ 0.8
   - Principle: `decision` category, importance ≥ 0.85

4. **Atomic entries.** Each memory should be < 500 chars. One fact per entry. No conversation dumps.

5. **Scope awareness.** Store project-specific memories in `project:<name>` scope. Store user preferences in `global` or `user:<id>` scope. Store agent learnings in `agent:<id>` scope.

6. **Session continuity.** When you detect the same platform thread ID, ALWAYS resume the existing session. Never create a new session for the same thread.

### How to Use the Memory API

#### Recall memories
```typescript
import { HermesMemoryEngine } from './adapters/hermes-plugin';

const engine = new HermesMemoryEngine(config);
const results = await engine.recall({
  query: "What database did we choose and why?",
  scope: "project:my-app",
  limit: 5
});
// results: Array<{ text: string, score: number, category: string }>
```

#### Store a memory
```typescript
await engine.store({
  text: "Chose PostgreSQL over MongoDB for ACID compliance and complex joins",
  category: "decision",
  scope: "project:my-app",
  importance: 0.9,
  metadata: { memory_category: "decisions" }
});
```

#### Resolve a session (deterministic)
```typescript
const session = await engine.resolveSession({
  platform: "discord",
  channelId: "1493777369616355329",
  threadId: "1493777369616355329"
});
// session: { sessionId, filePath, status: "active" | "new" }
// Same thread ID → same session, every time
```

#### Auto-capture at session end
```typescript
await engine.autoCapture({
  conversation: conversationMessages,
  sessionId: session.sessionId,
  scope: "global"
});
```

#### Auto-recall before prompt build
```typescript
const memories = await engine.autoRecall({
  prompt: userMessage,
  scope: "global",
  maxItems: 3,
  maxChars: 600
});
// Inject into system prompt as <relevant-memories>
```

### AGENTS.md Block (Copy Into Your System Prompt)

```markdown
## Memory Rules (Non-Negotiable)

### Rule 1 — Recall before answering
ALWAYS memory_recall before answering questions about past work,
preferences, decisions, or project context.

### Rule 2 — Store after learning
Every durable insight → immediately store:
- User preference → category: preference
- Technical decision → category: decision
- Project fact → category: fact
- Bug/lesson → TWO entries (fact + decision)

### Rule 3 — Atomic entries
Max 500 chars per memory. One fact per entry. No conversation dumps.

### Rule 4 — Scope correctly
- User preferences → scope: global or user:<id>
- Project decisions → scope: project:<name>
- Agent learnings → scope: agent:<id>

### Rule 5 — Session continuity
Same platform thread = same session. NEVER create new session for
existing thread. Use resolveSession() with platform:channelId:threadId.

### Rule 6 — LanceDB hygiene
After modifying .ts files under src/ or adapters/, clear jiti cache:
rm -rf /tmp/jiti/

### Rule 7 — Recall on failure
On ANY tool failure, ALWAYS recall with relevant keywords BEFORE retrying.
```

---

## Configuration

### Minimal (Hermes Agent)

```typescript
const config = {
  embedding: {
    provider: "openai-compatible",
    apiKey: process.env.OPENAI_API_KEY,
    model: "text-embedding-3-small",
    baseURL: "https://api.openai.com/v1"
  },
  dbPath: "~/.hermes/memory/lancedb",
  sessionRegistryPath: "~/.hermes/session-registry.json",
  autoCapture: true,
  autoRecall: true,
  smartExtraction: true,
  extractMinMessages: 2,
  extractMaxChars: 8000,
  llm: {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "google/gemini-2.5-flash",
    baseURL: "https://openrouter.ai/api/v1"
  },
  retrieval: {
    mode: "hybrid",
    vectorWeight: 0.7,
    bm25Weight: 0.3,
    rerank: "cross-encoder",
    candidatePoolSize: 20,
    minScore: 0.3,
    hardMinScore: 0.35,
    recencyHalfLifeDays: 14,
    recencyWeight: 0.1,
    filterNoise: true,
    lengthNormAnchor: 500
  }
};
```

### Embedding Providers

Works with **any OpenAI-compatible embedding API**:

| Provider | Model | Base URL | Dimensions |
| --- | --- | --- | --- |
| **OpenAI** | `text-embedding-3-small` | `https://api.openai.com/v1` | 1536 |
| **Jina** (recommended) | `jina-embeddings-v5-text-small` | `https://api.jina.ai/v1` | 1024 |
| **Google Gemini** | `gemini-embedding-001` | `https://generativelanguage.googleapis.com/v1beta/openai/` | 3072 |
| **Voyage** | `voyage-4-lite` | `https://api.voyageai.com/v1` | 1024 |
| **Ollama** (local) | `nomic-embed-text` | `http://localhost:11434/v1` | provider-specific |

### Rerank Providers

| Provider | `rerankProvider` | Example Model |
| --- | --- | --- |
| **Jina** (default) | `jina` | `jina-reranker-v3` |
| **SiliconFlow** (free tier) | `siliconflow` | `BAAI/bge-reranker-v2-m3` |
| **Voyage AI** | `voyage` | `rerank-2.5` |
| **Pinecone** | `pinecone` | `bge-reranker-v2-m3` |

---

## Database Schema

LanceDB table `memories`:

| Field | Type | Description |
| --- | --- | --- |
| `id` | string (UUID) | Primary key |
| `text` | string | Memory text (FTS indexed) |
| `vector` | float[] | Embedding vector |
| `category` | string | Storage category: `preference` / `fact` / `decision` / `entity` / `reflection` / `other` |
| `scope` | string | Scope identifier (e.g., `global`, `agent:main`) |
| `importance` | float | Importance score 0-1 |
| `timestamp` | int64 | Creation timestamp (ms) |
| `metadata` | string (JSON) | Extended metadata |

Common `metadata` keys: `l0_abstract`, `l1_overview`, `l2_content`, `memory_category`, `tier`, `access_count`, `confidence`, `last_accessed_at`

---

## CLI Commands

```bash
# List memories
openclaw memory-pro list [--scope global] [--category fact] [--limit 20] [--json]

# Search
openclaw memory-pro search "query" [--scope global] [--limit 10] [--json]

# Stats
openclaw memory-pro stats [--scope global] [--json]

# Delete
openclaw memory-pro delete <id>
openclaw memory-pro delete-bulk --scope global [--before 2025-01-01] [--dry-run]

# Export / Import
openclaw memory-pro export [--scope global] [--output memories.json]
openclaw memory-pro import memories.json [--scope global] [--dry-run]

# Upgrade legacy memories
openclaw memory-pro upgrade [--dry-run] [--batch-size 10] [--limit N]

# OAuth
openclaw memory-pro auth login [--provider openai-codex] [--model gpt-5.4]
openclaw memory-pro auth status
openclaw memory-pro auth logout
```

---

## File Reference

| File | Purpose |
| --- | --- |
| `index.ts` | Main entry point — plugin registration, config parsing, lifecycle hooks |
| `openclaw.plugin.json` | Plugin metadata + full JSON Schema config declaration |
| `cli.ts` | CLI commands for memory management |
| `src/store.ts` | LanceDB storage layer — table creation, FTS indexing, vector search, BM25 search, CRUD |
| `src/embedder.ts` | Embedding abstraction — any OpenAI-compatible provider |
| `src/retriever.ts` | Hybrid retrieval engine — vector + BM25 → fusion → rerank → decay → filter |
| `src/scopes.ts` | Multi-scope access control |
| `src/tools.ts` | Agent tool definitions — `memory_recall`, `memory_store`, `memory_forget`, `memory_update` |
| `src/smart-extractor.ts` | LLM-powered 6-category extraction with L0/L1/L2 metadata |
| `src/decay-engine.ts` | Weibull stretched-exponential decay model |
| `src/tier-manager.ts` | Three-tier promotion/demotion: Peripheral ↔ Working ↔ Core |
| `src/session-recovery.ts` | Session file path resolution and registry logic |
| `src/noise-filter.ts` | Filters agent refusals, meta-questions, greetings, boilerplate |
| `src/adaptive-retrieval.ts` | Determines whether a query needs memory retrieval |
| `src/memory-compactor.ts` | Background compaction of long-term memory |
| `src/reflection-store.ts` | Reflection-based memory with governance |

---

## Upstream Sync Guide

This fork maintains a clean relationship with the upstream project:

### Initial Setup
```bash
git remote add upstream https://github.com/CortexReach/memory-lancedb-pro.git
```

### Pull Upstream Fixes
```bash
git fetch upstream
git checkout master
git merge upstream/master          # update mirror
git checkout hermes-adapt
git merge master                   # pull fixes into adapter branch
# resolve conflicts in src/ (our adapters/ files won't conflict)
```

### What We Keep Synced
- `src/store.ts`, `src/embedder.ts`, `src/retriever.ts` — core engine
- `src/smart-extractor.ts`, `src/decay-engine.ts`, `src/tier-manager.ts` — smart extraction & lifecycle
- `src/noise-filter.ts`, `src/adaptive-retrieval.ts` — quality filters
- `src/scopes.ts` — multi-scope isolation

### What We Own (Never Upstream)
- `adapters/` — Hermes adapter layer
- Session registry logic
- Hermes-specific integration points

---

## Troubleshooting

### "Cannot mix BigInt and other types"
Upgrade to `memory-lancedb-pro >= 1.0.14` — coerces BigInt values before arithmetic.

### Auto-recall times out
Increase `autoRecallTimeoutMs` (default: 5000ms). Check embedding API latency first.

### Session not resuming
Check `~/.hermes/session-registry.json` — the key format must be `platform:channelId:threadId`. Verify the thread ID is being passed correctly to `resolveSession()`.

### Memories not being recalled
1. Check `autoRecall: true` is set
2. Verify embedding API is configured and reachable
3. Run `openclaw memory-pro stats` to confirm memories exist
4. Check `minScore` and `hardMinScore` thresholds

### Clear jiti cache after code changes
```bash
rm -rf /tmp/jiti/
openclaw gateway restart
```

---

## Dependencies

| Package | Purpose |
| --- | --- |
| `@lancedb/lancedb` ≥0.26.2 | Vector database (ANN + FTS) |
| `openai` ≥6.21.0 | OpenAI-compatible API client |
| `@sinclair/typebox` 0.34.48 | JSON Schema type definitions |
| `apache-arrow` 18.1.0 | Columnar data format (LanceDB) |

---

## Documentation

| Document | Description |
| --- | --- |
| [Memory Architecture Analysis](docs/memory_architecture_analysis.md) | Full architecture deep-dive |
| [OpenClaw Integration Playbook](docs/openclaw-integration-playbook.md) | Deployment modes, verification, regression matrix |
| [CHANGELOG v1.1.0](docs/CHANGELOG-v1.1.0.md) | v1.1.0 behavior changes and upgrade rationale |
| [Long-Context Chunking](docs/long-context-chunking.md) | Chunking strategy for long documents |

---

## License

MIT — forked from [CortexReach/memory-lancedb-pro](https://github.com/CortexReach/memory-lancedb-pro).

Hermes adapter layer © Theophilus Chinomona.

---

## Star History (Upstream)

<a href="https://star-history.com/#CortexReach/memory-lancedb-pro&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=CortexReach/memory-lancedb-pro&type=Date&theme=dark&transparent=true" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=CortexReach/memory-lancedb-pro&type=Date&transparent=true" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=CortexReach/memory-lancedb-pro&type=Date&transparent=true" />
  </picture>
</a>
