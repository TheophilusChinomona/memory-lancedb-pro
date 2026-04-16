/**
 * Hermes Memory LanceDB — Plugin Adapter
 *
 * Portable memory engine adapter for Hermes Agent.
 * Maps OpenClaw's plugin lifecycle hooks to Hermes equivalents:
 *
 * OpenClaw Hook              ->  Hermes Equivalent
 * ─────────────────────────────────────────────────────
 * agent_end (auto-capture)   ->  autoCapture() at session end
 * before_prompt_build        ->  autoRecall() before prompt build
 * session_end                ->  lifecycle maintenance
 *
 * The core memory engine (store, retriever, embedder, etc.) is unchanged.
 */

import { join } from "node:path";
import { mkdirSync } from "node:fs";

// Import portable modules (unchanged from memory-lancedb-pro)
import { MemoryStore, type MemoryEntry } from "../src/store.js";
import { createEmbedder, getVectorDimensions, type Embedder } from "../src/embedder.js";
import { createRetriever, DEFAULT_RETRIEVAL_CONFIG, type MemoryRetriever } from "../src/retriever.js";
import { createScopeManager, type MemoryScopeManager } from "../src/scopes.js";
import { isNoise } from "../src/noise-filter.js";
import { SmartExtractor } from "../src/smart-extractor.js";
import { createDecayEngine, DEFAULT_DECAY_CONFIG } from "../src/decay-engine.js";
import { createTierManager, DEFAULT_TIER_CONFIG } from "../src/tier-manager.js";
import { createLlmClient, type LlmClient } from "../src/llm-client.js";
import {
  buildSmartMetadata,
  stringifySmartMetadata,
} from "../src/smart-metadata.js";
import { shouldSkipRetrieval } from "../src/adaptive-retrieval.js";

// Import Hermes-specific adapters
import {
  buildSessionKey,
  lookupSession,
  registerSession,
  touchSession,
  markDormant,
  type SessionRecoveryConfig,
  type SessionRegistryEntry,
} from "./session-recovery.js";

// ============================================================================
// Types
// ============================================================================

export type MemoryCategory = "preference" | "fact" | "decision" | "entity" | "other" | "reflection";

export interface HermesMemoryConfig {
  embedding: {
    provider: "openai-compatible" | "azure-openai";
    apiKey: string | string[];
    model?: string;
    baseURL?: string;
    dimensions?: number;
    taskQuery?: string;
    taskPassage?: string;
    normalized?: boolean;
    chunking?: boolean;
  };
  dbPath?: string;
  sessionRegistryPath?: string;
  autoCapture?: boolean;
  autoRecall?: boolean;
  autoRecallMinLength?: number;
  autoRecallMaxItems?: number;
  autoRecallMaxChars?: number;
  autoRecallPerItemMaxChars?: number;
  smartExtraction?: boolean;
  extractMinMessages?: number;
  extractMaxChars?: number;
  sessionMemory?: {
    enabled?: boolean;
    messageCount?: number;
  };
  retrieval?: {
    mode?: "hybrid" | "vector";
    vectorWeight?: number;
    bm25Weight?: number;
    minScore?: number;
    rerank?: "cross-encoder" | "lightweight" | "none";
    rerankProvider?: "jina" | "siliconflow" | "voyage" | "pinecone" | "dashscope" | "tei";
    rerankApiKey?: string;
    rerankModel?: string;
    rerankEndpoint?: string;
    candidatePoolSize?: number;
    hardMinScore?: number;
    recencyHalfLifeDays?: number;
    recencyWeight?: number;
    filterNoise?: boolean;
    lengthNormAnchor?: number;
    timeDecayHalfLifeDays?: number;
    reinforcementFactor?: number;
    maxHalfLifeMultiplier?: number;
  };
  decay?: {
    recencyHalfLifeDays?: number;
    recencyWeight?: number;
    frequencyWeight?: number;
    intrinsicWeight?: number;
  };
  llm?: {
    apiKey?: string;
    model: string;
    baseURL?: string;
    timeoutMs?: number;
  };
  scopes?: {
    default?: string;
    definitions?: Record<string, { description: string }>;
  };
}

export interface HermesSessionContext {
  sessionId: string;
  platform: string;
  channelId?: string;
  threadId?: string;
  agentId?: string;
}

export interface HermesLogger {
  info(msg: string): void;
  warn(msg: string): void;
  debug(msg: string): void;
  error(msg: string): void;
}

export interface RecallResult {
  text: string;
  score: number;
  category: string;
  scope: string;
  importance: number;
  timestamp: number;
}

// ============================================================================
// Default Config
// ============================================================================

const DEFAULT_CONFIG: Partial<HermesMemoryConfig> = {
  dbPath: "~/.hermes/memory/lancedb",
  autoCapture: true,
  autoRecall: true,
  autoRecallMinLength: 15,
  autoRecallMaxItems: 3,
  autoRecallMaxChars: 600,
  autoRecallPerItemMaxChars: 180,
  smartExtraction: true,
  extractMinMessages: 2,
  extractMaxChars: 8000,
  sessionMemory: { enabled: false },
  retrieval: {
    mode: "hybrid",
    vectorWeight: 0.7,
    bm25Weight: 0.3,
    minScore: 0.3,
    rerank: "cross-encoder",
    candidatePoolSize: 20,
    hardMinScore: 0.35,
    recencyHalfLifeDays: 14,
    recencyWeight: 0.1,
    filterNoise: true,
    lengthNormAnchor: 500,
  },
};

// ============================================================================
// Engine
// ============================================================================

export class HermesMemoryEngine {
  private config: HermesMemoryConfig;
  private hermesHome: string;
  private logger: HermesLogger;
  private _store: MemoryStore | null = null;
  private _embedder: Embedder | null = null;
  private _retriever: MemoryRetriever | null = null;
  private _scopeManager: MemoryScopeManager | null = null;
  private _smartExtractor: SmartExtractor | null = null;
  private _decayEngine: ReturnType<typeof createDecayEngine> | null = null;
  private _tierManager: ReturnType<typeof createTierManager> | null = null;
  private _llmClient: LlmClient | null = null;
  private sessionConfig: SessionRecoveryConfig;
  private initialized = false;

  constructor(config: Partial<HermesMemoryConfig>, logger?: HermesLogger) {
    this.config = { ...DEFAULT_CONFIG, ...config } as HermesMemoryConfig;
    this.hermesHome = process.env.HERMES_HOME
      || join(process.env.HOME || "/root", ".hermes");
    this.logger = logger || console as unknown as HermesLogger;

    const registryPath = this.config.sessionRegistryPath
      || join(this.hermesHome, "session-registry.json");
    this.sessionConfig = {
      hermesHome: this.hermesHome,
      sessionRegistryPath: registryPath,
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info("hermes-memory-lancedb: initializing...");

    // Resolve DB path
    const dbPath = this.config.dbPath!.replace("~", process.env.HOME || "/root");
    mkdirSync(dbPath, { recursive: true });

    // Resolve vector dimensions from model name or explicit override
    const model = this.config.embedding.model || "text-embedding-3-small";
    const vectorDim = this.config.embedding.dimensions
      || getVectorDimensions(model);

    // Initialize store (lazy — no explicit init needed)
    this._store = new MemoryStore({ dbPath, vectorDim });

    // Initialize embedder
    this._embedder = createEmbedder({
      provider: this.config.embedding.provider,
      apiKey: this.config.embedding.apiKey,
      model: model, // resolved above with default
      baseURL: this.config.embedding.baseURL,
      dimensions: this.config.embedding.dimensions,
      taskQuery: this.config.embedding.taskQuery,
      taskPassage: this.config.embedding.taskPassage,
      normalized: this.config.embedding.normalized,
      chunking: this.config.embedding.chunking,
    });

    // Initialize decay engine (for lifecycle scoring)
    this._decayEngine = createDecayEngine({
      ...DEFAULT_DECAY_CONFIG,
      ...(this.config.decay || {}),
    });

    // Initialize retriever with decay engine
    this._retriever = createRetriever(
      this._store,
      this._embedder,
      {
        ...DEFAULT_RETRIEVAL_CONFIG,
        ...this.config.retrieval,
      },
      { decayEngine: this._decayEngine },
    );

    // Initialize scope manager
    this._scopeManager = createScopeManager(this.config.scopes);

    // Initialize tier manager
    this._tierManager = createTierManager(DEFAULT_TIER_CONFIG);

    // Initialize LLM client + smart extractor
    if (this.config.smartExtraction && this.config.llm?.model) {
      try {
        this._llmClient = createLlmClient({
          apiKey: this.config.llm.apiKey,
          model: this.config.llm.model,
          baseURL: this.config.llm.baseURL,
          timeoutMs: this.config.llm.timeoutMs,
        });
        this._smartExtractor = new SmartExtractor(
          this._store,
          this._embedder,
          this._llmClient,
          {
            extractMinMessages: this.config.extractMinMessages,
            extractMaxChars: this.config.extractMaxChars,
            defaultScope: this.config.scopes?.default || "global",
            log: (msg: string) => this.logger.debug(msg),
          },
        );
        this.logger.info("hermes-memory-lancedb: smart extraction enabled");
      } catch (err) {
        this.logger.warn(`hermes-memory-lancedb: smart extraction init failed: ${err}`);
      }
    }

    this.initialized = true;
    this.logger.info("hermes-memory-lancedb: initialized successfully");
  }

  // ========================================================================
  // Session Recovery API
  // ========================================================================

  /**
   * Look up or create a session for a given platform/channel/thread.
   * This is the core fix for the "session expiry" problem.
   *
   * Same thread ID → same session, every time.
   */
  resolveSession(ctx: HermesSessionContext): {
    sessionKey: string;
    entry: SessionRegistryEntry | null;
    isNew: boolean;
  } {
    const sessionKey = buildSessionKey(
      ctx.platform,
      ctx.channelId || "default",
      ctx.threadId,
    );

    const existing = lookupSession(sessionKey, this.sessionConfig);

    if (existing) {
      touchSession(sessionKey, this.sessionConfig);
      this.logger.debug(
        `hermes-memory-lancedb: resumed session ${existing.session_id} for ${sessionKey}`,
      );
      return { sessionKey, entry: existing, isNew: false };
    }

    // Create new registry entry
    const newEntry: SessionRegistryEntry = {
      session_id: ctx.sessionId,
      created: new Date().toISOString(),
      last_active: new Date().toISOString(),
      platform: ctx.platform,
      channel_id: ctx.channelId || "default",
      thread_id: ctx.threadId,
      status: "active",
    };

    registerSession(sessionKey, newEntry, this.sessionConfig);
    this.logger.info(
      `hermes-memory-lancedb: registered new session ${ctx.sessionId} for ${sessionKey}`,
    );
    return { sessionKey, entry: newEntry, isNew: true };
  }

  /**
   * Mark a session as dormant (keeps it resumable, unlike expiry).
   */
  sessionDormant(platform: string, channelId: string, threadId?: string): void {
    const sessionKey = buildSessionKey(platform, channelId, threadId);
    markDormant(sessionKey, this.sessionConfig);
  }

  // ========================================================================
  // Auto-Recall (before_prompt_build equivalent)
  // ========================================================================

  /**
   * Retrieve relevant memories for injection into the current prompt.
   * Call this before building the system prompt.
   */
  async autoRecall(
    messageText: string,
    scope?: string,
  ): Promise<RecallResult[] | null> {
    if (!this.initialized || !this.config.autoRecall) return null;

    // Skip retrieval for short/greeting messages
    if (shouldSkipRetrieval(messageText)) {
      return null;
    }

    try {
      const effectiveScope = scope || this.config.scopes?.default || "global";
      const maxItems = this.config.autoRecallMaxItems || 3;

      const results = await this._retriever!.retrieve({
        query: messageText,
        limit: maxItems,
        scopeFilter: [effectiveScope],
        source: "auto-recall",
      });

      if (!results || results.length === 0) return null;

      // Respect per-item and total char budgets
      const maxTotalChars = this.config.autoRecallMaxChars || 600;
      const maxPerItemChars = this.config.autoRecallPerItemMaxChars || 180;

      const recallResults: RecallResult[] = [];
      let totalChars = 0;

      for (const r of results) {
        if (totalChars >= maxTotalChars) break;
        const text = r.entry.text.slice(0, maxPerItemChars);
        totalChars += text.length;
        recallResults.push({
          text,
          score: r.score,
          category: r.entry.category,
          scope: r.entry.scope,
          importance: r.entry.importance,
          timestamp: r.entry.timestamp,
        });
      }

      return recallResults;
    } catch (err) {
      this.logger.warn(`hermes-memory-lancedb: auto-recall failed: ${err}`);
      return null;
    }
  }

  /**
   * Format auto-recall results as an injectable context block.
   */
  formatRecallContext(memories: RecallResult[]): string {
    if (!memories || memories.length === 0) return "";
    const lines = memories.map(m => `- ${m.text}`);
    return `<relevant-memories>\n${lines.join("\n")}\n</relevant-memories>`;
  }

  // ========================================================================
  // Auto-Capture (agent_end equivalent)
  // ========================================================================

  /**
   * Extract and store memories from a conversation.
   * Call this at the end of a session or periodically.
   *
   * Uses SmartExtractor.extractAndPersist() when LLM is available,
   * falls back to regex capture otherwise.
   */
  async autoCapture(
    messages: Array<{ role: string; content: string }>,
    sessionId?: string,
    scope?: string,
  ): Promise<{ created: number; merged: number; skipped: number }> {
    if (!this.initialized || !this.config.autoCapture) {
      return { created: 0, merged: 0, skipped: 0 };
    }

    const effectiveScope = scope || this.config.scopes?.default || "global";
    const effectiveSessionId = sessionId || "unknown";

    try {
      if (this._smartExtractor) {
        // Smart extraction path — LLM-powered 6-category extraction
        const conversationText = messages
          .map(m => `${m.role}: ${m.content}`)
          .join("\n");

        const stats = await this._smartExtractor.extractAndPersist(
          conversationText,
          effectiveSessionId,
          { scope: effectiveScope },
        );

        if (stats.created > 0) {
          this.logger.debug(
            `hermes-memory-lancedb: auto-captured ${stats.created} new, ${stats.merged} merged`,
          );
        }

        return {
          created: stats.created,
          merged: stats.merged,
          skipped: stats.skipped,
        };
      } else {
        // Regex fallback: store last meaningful user message
        const lastUserMsg = [...messages]
          .reverse()
          .find(m => m.role === "user" && !isNoise(m.content));

        if (!lastUserMsg) return { created: 0, merged: 0, skipped: 0 };

        const text = lastUserMsg.content.slice(0, 500);
        const vector = await this._embedder!.embed(text);
        const metadata = stringifySmartMetadata(
          buildSmartMetadata({ category: "other", importance: 0.5 }),
        );

        await this._store!.store({
          text,
          vector,
          category: "other",
          scope: effectiveScope,
          importance: 0.5,
          metadata,
        });

        this.logger.debug("hermes-memory-lancedb: auto-captured 1 memory (regex fallback)");
        return { created: 1, merged: 0, skipped: 0 };
      }
    } catch (err) {
      this.logger.warn(`hermes-memory-lancedb: auto-capture failed: ${err}`);
      return { created: 0, merged: 0, skipped: 0 };
    }
  }

  // ========================================================================
  // Direct API (for agent tools)
  // ========================================================================

  /**
   * Recall memories matching a query.
   */
  async recall(
    query: string,
    options?: { scope?: string; limit?: number; category?: string },
  ): Promise<RecallResult[]> {
    if (!this.initialized) await this.initialize();

    const scope = options?.scope || this.config.scopes?.default || "global";
    const limit = options?.limit || 5;

    const results = await this._retriever!.retrieve({
      query,
      limit,
      scopeFilter: [scope],
      category: options?.category,
      source: "manual",
    });

    return results.map(r => ({
      text: r.entry.text,
      score: r.score,
      category: r.entry.category,
      scope: r.entry.scope,
      importance: r.entry.importance,
      timestamp: r.entry.timestamp,
    }));
  }

  /**
   * Store a memory entry.
   * Returns the full entry with auto-generated id and timestamp.
   */
  async store(
    text: string,
    options?: {
      category?: MemoryCategory;
      scope?: string;
      importance?: number;
      metadata?: Record<string, unknown>;
    },
  ): Promise<MemoryEntry> {
    if (!this.initialized) await this.initialize();

    const category: MemoryCategory = options?.category || "other";
    const scope = options?.scope || this.config.scopes?.default || "global";
    const importance = options?.importance ?? 0.5;

    const vector = await this._embedder!.embed(text);
    const metadataObj = buildSmartMetadata({ category, importance });
    if (options?.metadata) {
      Object.assign(metadataObj, options.metadata);
    }
    const metadata = stringifySmartMetadata(metadataObj);

    const entry = await this._store!.store({
      text,
      vector,
      category,
      scope,
      importance,
      metadata,
    });

    return entry;
  }

  /**
   * Delete a memory by ID.
   */
  async forget(id: string): Promise<boolean> {
    if (!this.initialized) return false;
    return this._store!.delete(id);
  }

  /**
   * Get memory stats.
   */
  async stats(scope?: string): Promise<Record<string, unknown>> {
    if (!this.initialized) return { initialized: false };
    return {
      initialized: true,
      ...(await this._store!.stats(scope ? [scope] : undefined)),
    };
  }

  // ========================================================================
  // Lifecycle Maintenance
  // ========================================================================

  /**
   * Run decay + tier evaluation on all memories.
   * Call periodically (e.g., daily cron).
   *
   * Note: This is a no-op placeholder — the upstream decay/tier APIs
   * require iterating memories as arrays. In production, use the CLI:
   *   openclaw memory-pro upgrade
   * or implement the array-fetch logic here.
   */
  async runLifecycleMaintenance(): Promise<void> {
    if (!this.initialized) return;
    this.logger.debug(
      "hermes-memory-lancedb: lifecycle maintenance — use 'openclaw memory-pro upgrade' or implement fetch-all loop",
    );
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createHermesMemoryEngine(
  config: Partial<HermesMemoryConfig>,
  logger?: HermesLogger,
): HermesMemoryEngine {
  return new HermesMemoryEngine(config, logger);
}
