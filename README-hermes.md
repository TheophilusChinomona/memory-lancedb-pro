# hermes-memory-lancedb

**Production-grade long-term memory for Hermes Agent**, ported from [memory-lancedb-pro](https://github.com/CortexReach/memory-lancedb-pro) (OpenClaw).

Give your Hermes agent a brain that remembers — across sessions, across channels, across time.

## Why This Exists

Hermes has a fundamental session persistence problem: when a Discord thread or WhatsApp chat goes idle, the session expires and all context is lost. OpenClaw solved this with a deterministic `sessionKey` + `sessions.json` registry. This package brings that solution to Hermes, plus the full memory engine.

## What's Included

| Component | Source | Status |
|-----------|--------|--------|
| **LanceDB Store** | memory-lancedb-pro | ✅ Portable (zero changes) |
| **Hybrid Retrieval** (Vector + BM25) | memory-lancedb-pro | ✅ Portable |
| **Smart Extraction** (6-category LLM) | memory-lancedb-pro | ✅ Portable |
| **Weibull Decay + 3-Tier Promotion** | memory-lancedb-pro | ✅ Portable |
| **Cross-Encoder Reranking** | memory-lancedb-pro | ✅ Portable |
| **Noise Filtering** | memory-lancedb-pro | ✅ Portable |
| **Multi-Scope Isolation** | memory-lancedb-pro | ✅ Portable |
| **Embedder** (any OpenAI-compatible) | memory-lancedb-pro | ✅ Portable |
| **Chunker** | memory-lancedb-pro | ✅ Portable |
| **Session Recovery** | NEW | ✅ Built for Hermes |
| **Hermes Plugin Adapter** | NEW | ✅ Replaces OpenClaw index.ts |
| **Session Registry** | NEW | ✅ Discord/WhatsApp thread mapping |

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                Hermes Agent Runtime                   │
│  (Discord, WhatsApp, Telegram, CLI)                   │
└──────────────┬───────────────────────┬───────────────┘
               │                       │
        ┌──────▼──────┐         ┌──────▼──────┐
        │ Auto-Recall │         │ Auto-Capture│
        │ (pre-prompt)│         │ (post-sess.)│
        └──────┬──────┘         └──────┬──────┘
               │                       │
        ┌──────▼───────────────────────▼──────┐
        │         HermesMemoryEngine           │
        │  ┌─────────┐  ┌──────────────────┐  │
        │  │ Session  │  │  Memory Engine   │  │
        │  │ Registry │  │  (from lancedb-  │  │
        │  │ (NEW)    │  │   pro, portable) │  │
        │  └─────────┘  └──────────────────┘  │
        └──────────────────┬──────────────────┘
                           │
                    ┌──────▼──────┐
                    │   LanceDB   │
                    │  (local)    │
                    └─────────────┘
```

## Session Recovery (The Key Fix)

### The Problem
```
User sends message in Discord thread
  → Hermes creates session_20260415_193554_da8865dd.json
  → 2 hours pass
  → User sends another message in SAME thread
  → Hermes creates NEW session_20260416_061800_xxxxxx.json
  → All prior context is LOST
```

### The Solution
```typescript
import { createHermesMemoryEngine } from "hermes-memory-lancedb";

const engine = createHermesMemoryEngine({ /* config */ });
await engine.initialize();

// On every message, resolve the session FIRST
const session = engine.resolveSession({
  sessionId: "hermes-generated-id",
  platform: "discord",
  channelId: "1493777369616355329",  // thread ID
});

if (!session.isNew) {
  // Resume existing session — context is preserved
  console.log(`Resumed session: ${session.entry.session_id}`);
} else {
  console.log(`New session created: ${session.entry.session_id}`);
}
```

### Registry Format (`~/.hermes/session-registry.json`)
```json
{
  "discord:1493777369616355329": {
    "session_id": "20260415_193554_da8865dd",
    "created": "2026-04-15T20:28:56Z",
    "last_active": "2026-04-16T06:18:00Z",
    "platform": "discord",
    "channel_id": "1493777369616355329",
    "status": "active"
  },
  "whatsapp:+27712345678": {
    "session_id": "20260414_120000_abc123",
    "created": "2026-04-14T12:00:00Z",
    "last_active": "2026-04-15T08:30:00Z",
    "platform": "whatsapp",
    "channel_id": "+27712345678",
    "status": "dormant"
  }
}
```

Sessions are marked **dormant** (not expired) on idle — they stay resumable indefinitely.

## Quick Start

### 1. Install

```bash
cd hermes-memory-lancedb
npm install
```

### 2. Configure

```typescript
import { createHermesMemoryEngine } from "hermes-memory-lancedb";

const engine = createHermesMemoryEngine({
  embedding: {
    provider: "openai-compatible",
    apiKey: "sk-...",                    // or Jina, Gemini, Ollama
    model: "text-embedding-3-small",
    baseURL: "https://api.openai.com/v1",
    dimensions: 1536,
  },
  dbPath: "~/.hermes/memory/lancedb",
  autoCapture: true,
  autoRecall: true,
  smartExtraction: true,
  extractMinMessages: 2,
  llm: {
    apiKey: "sk-...",
    model: "gpt-4o-mini",
    baseURL: "https://api.openai.com/v1",
  },
  retrieval: {
    mode: "hybrid",
    vectorWeight: 0.7,
    bm25Weight: 0.3,
    rerank: "cross-encoder",
    hardMinScore: 0.35,
  },
});

await engine.initialize();
```

### 3. Use

```typescript
// Session recovery
const session = engine.resolveSession({
  sessionId: "current-session",
  platform: "discord",
  channelId: threadId,
});

// Auto-recall (inject before prompt)
const memories = await engine.autoRecall("what were we discussing?");

// Auto-capture (extract after session)
await engine.autoCapture(conversationMessages);

// Direct API
await engine.store("User prefers ChatGPT OAuth over pay-per-token", {
  category: "preference",
  importance: 0.8,
});

const results = await engine.recall("user preferences");

await engine.forget("memory-id-to-delete");

// Lifecycle maintenance (run on cron)
await engine.runLifecycleMaintenance();
```

## Embedding Providers

| Provider | Model | Base URL |
|----------|-------|----------|
| **OpenAI** | `text-embedding-3-small` | `https://api.openai.com/v1` |
| **Jina** (recommended) | `jina-embeddings-v5-text-small` | `https://api.jina.ai/v1` |
| **Gemini** | `gemini-embedding-001` | `https://generativelanguage.googleapis.com/v1beta/openai/` |
| **Ollama** (local) | `nomic-embed-text` | `http://localhost:11434/v1` |

## What Changed from memory-lancedb-pro

| Aspect | memory-lancedb-pro (OpenClaw) | hermes-memory-lancedb |
|--------|-------------------------------|----------------------|
| Plugin API | `OpenClawPluginApi` | `HermesMemoryEngine` class |
| Session resolution | OpenClaw gateway `sessionKey` | `SessionRegistry` + `buildSessionKey()` |
| Lifecycle hooks | `api.on("agent_end", ...)` | Direct method calls |
| Tool registration | `api.registerTool(...)` | Standalone functions |
| Session paths | `~/.openclaw/agents/*/sessions/` | `~/.hermes/sessions/` + registry |
| Config | `openclaw.json` | Constructor config object |

## File Map

```
hermes-memory-lancedb/
├── index.ts                    # Entry point + re-exports
├── package.json                # Dependencies (same as lancedb-pro)
├── adapters/
│   ├── hermes-plugin.ts        # Main engine (replaces index.ts)
│   └── session-recovery.ts     # Session registry (replaces session-recovery.ts)
├── src/                        # Portable core (38 files, unchanged)
│   ├── store.ts                # LanceDB CRUD
│   ├── embedder.ts             # Embedding abstraction
│   ├── retriever.ts            # Hybrid retrieval pipeline
│   ├── smart-extractor.ts      # LLM-powered extraction
│   ├── decay-engine.ts         # Weibull decay
│   ├── tier-manager.ts         # 3-tier promotion
│   ├── scopes.ts               # Multi-scope isolation
│   ├── noise-filter.ts         # Content quality filter
│   ├── chunker.ts              # Long-context chunking
│   └── ... (34 more)
└── README.md
```

## License

MIT (same as memory-lancedb-pro)
