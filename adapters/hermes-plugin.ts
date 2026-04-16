/**
 * Hermes Memory LanceDB — Plugin Adapter
 * 
 * This replaces OpenClaw's index.ts with a Hermes-compatible adapter.
 * It maps OpenClaw's plugin lifecycle hooks to Hermes equivalents:
 * 
 * OpenClaw Hook              ->  Hermes Equivalent
 * ─────────────────────────────────────────────────────
 * before_agent_start         ->  memory injection at session start
 * agent_end (auto-capture)   ->  memory extraction at session end
 * message_received           ->  noise pre-filtering
 * before_prompt_build        ->  auto-recall injection
 * session_end                ->  reflection + compaction
 * command:new / command:reset ->  session reset hook
 * 
 * The core memory engine (store, retriever, embedder, etc.) is unchanged.
 */

import { join } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

// Import portable modules (unchanged from memory-lancedb-pro)
import { MemoryStore, validateStoragePath } from "../src/store.js";
import { createEmbedder, getVectorDimensions } from "../src/embedder.js";
import { createRetriever, DEFAULT_RETRIEVAL_CONFIG } from "../src/retriever.js";
import { createScopeManager } from "../src/scopes.js";
import { isNoise } from "../src/noise-filter.js";
import { SmartExtractor } from "../src/smart-extractor.js";
import { createDecayEngine, DEFAULT_DECAY_CONFIG } from "../src/decay-engine.js";
import { createTierManager, DEFAULT_TIER_CONFIG } from "../src/tier-manager.js";
import { createLlmClient } from "../src/llm-client.js";
import {
  buildSmartMetadata,
  parseSmartMetadata,
  stringifySmartMetadata,
} from "../src/smart-metadata.js";
import { shouldSkipRetrieval } from "../src/adaptive-retrieval.js";

// Import Hermes-specific adapters
import {
  buildSessionKey,
  loadRegistry,
  saveRegistry,
  lookupSession,
  registerSession,
  touchSession,
  markDormant,
  discoverSessionFiles,
  findSessionsForChannel,
  resolveSessionSearchDirs,
  type SessionRecoveryConfig,
  type SessionRegistryEntry,
} from "./session-recovery.js";

// ============================================================================
// Types
// ============================================================================

export interface HermesMemoryConfig {
  embedding: {
    provider: "openai-compatible";
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
  autoCapture?: boolean;
  autoRecall?: boolean;
  autoRecallMinLength?: number;
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
    rerankProvider?: string;
    rerankApiKey?: string;
    rerankModel?: string;
    rerankEndpoint?: string;
    candidatePoolSize?: number;
    hardMinScore?: number;
    filterNoise?: boolean;
  };
  llm?: {
    apiKey?: string;
    model?: string;
    baseURL?: string;
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
  sessionFilePath?: string;
}

export interface HermesLogger {
  info(msg: string): void;
  warn(msg: string): void;
  debug(msg: string): void;
  error(msg: string): void;
}

// ============================================================================
// Default Config
// ============================================================================

const DEFAULT_CONFIG: Partial<HermesMemoryConfig> = {
  dbPath: "~/.hermes/memory/lancedb",
  autoCapture: true,
  autoRecall: true,
  smartExtraction: true,
  extractMinMessages: 2,
  extractMaxChars: 8000,
  sessionMemory: { enabled: false },
  retrieval: {
    ...DEFAULT_RETRIEVAL_CONFIG,
    filterNoise: true,
  },
};

// ============================================================================
// Engine
// ============================================================================

export class HermesMemoryEngine {
  private config: HermesMemoryConfig;
  private hermesHome: string;
  private logger: HermesLogger;
  private store: MemoryStore | null = null;
  private embedder: any = null;
  private retriever: any = null;
  private scopeManager: any = null;
  private smartExtractor: SmartExtractor | null = null;
  private decayEngine: any = null;
  private tierManager: any = null;
  private llmClient: any = null;
  private sessionConfig: SessionRecoveryConfig;
  private initialized = false;

  constructor(config: Partial<HermesMemoryConfig>, logger?: HermesLogger) {
    this.config = { ...DEFAULT_CONFIG, ...config } as HermesMemoryConfig;
    this.hermesHome = process.env.HERMES_HOME 
      || join(process.env.HOME || "/root", ".hermes");
    this.logger = logger || console as any;
    this.sessionConfig = {
      hermesHome: this.hermesHome,
      sessionRegistryPath: join(this.hermesHome, "session-registry.json"),
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.logger.info("hermes-memory-lancedb: initializing...");

    // Resolve DB path
    const dbPath = this.config.dbPath!.replace("~", process.env.HOME || "/root");
    mkdirSync(dbPath, { recursive: true });

    // Initialize store
    const vectorDim = this.config.embedding.dimensions 
      || await getVectorDimensions(this.config.embedding);
    this.store = new MemoryStore({ dbPath, vectorDim });
    await this.store.initialize();

    // Initialize embedder
    this.embedder = createEmbedder(this.config.embedding);

    // Initialize retriever
    this.retriever = createRetriever(this.store, this.embedder, {
      ...DEFAULT_RETRIEVAL_CONFIG,
      ...this.config.retrieval,
    });

    // Initialize scope manager
    this.scopeManager = createScopeManager(this.config.scopes);

    // Initialize LLM client (for smart extraction)
    if (this.config.smartExtraction && this.config.llm) {
      try {
        this.llmClient = createLlmClient(this.config.llm);
        this.smartExtractor = new SmartExtractor(this.llmClient, {
          minMessages: this.config.extractMinMessages,
          maxChars: this.config.extractMaxChars,
        });
        this.logger.info("hermes-memory-lancedb: smart extraction enabled");
      } catch (err) {
        this.logger.warn(`hermes-memory-lancedb: smart extraction init failed: ${err}`);
      }
    }

    // Initialize lifecycle engines
    this.decayEngine = createDecayEngine(DEFAULT_DECAY_CONFIG);
    this.tierManager = createTierManager(DEFAULT_TIER_CONFIG);

    this.initialized = true;
    this.logger.info("hermes-memory-lancedb: initialized successfully");
  }

  // ========================================================================
  // Session Recovery API
  // ========================================================================

  /**
   * Look up or create a session for a given platform/channel/thread.
   * This is the core fix for the "session expiry" problem.
   */
  resolveSession(ctx: HermesSessionContext): {
    sessionKey: string;
    entry: SessionRegistryEntry | null;
    isNew: boolean;
  } {
    const sessionKey = buildSessionKey(
      ctx.platform,
      ctx.channelId || "default",
      ctx.threadId
    );

    const existing = lookupSession(sessionKey, this.sessionConfig);

    if (existing) {
      // Touch to update last_active
      touchSession(sessionKey, this.sessionConfig);
      this.logger.debug(`hermes-memory-lancedb: resumed session ${existing.session_id} for ${sessionKey}`);
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
    this.logger.info(`hermes-memory-lancedb: registered new session ${ctx.sessionId} for ${sessionKey}`);
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
  // Auto-Recall (before_agent_start equivalent)
  // ========================================================================

  /**
   * Retrieve relevant memories for injection into the current prompt.
   * Call this before building the system prompt.
   */
  async autoRecall(
    messageText: string,
    scope?: string
  ): Promise<string | null> {
    if (!this.initialized || !this.config.autoRecall) return null;

    // Skip retrieval for noise (greetings, emoji, etc.)
    if (shouldSkipRetrieval(messageText)) {
      return null;
    }

    try {
      const effectiveScope = scope || this.config.scopes?.default || "global";
      const results = await this.retriever.search(messageText, {
        scope: effectiveScope,
        topK: 3,
      });

      if (!results || results.length === 0) return null;

      const memoryLines = results.map(
        (r: any) => `- ${r.entry.text}`
      );

      return `<relevant-memories>\n${memoryLines.join("\n")}\n</relevant-memories>`;
    } catch (err) {
      this.logger.warn(`hermes-memory-lancedb: auto-recall failed: ${err}`);
      return null;
    }
  }

  // ========================================================================
  // Auto-Capture (agent_end equivalent)
  // ========================================================================

  /**
   * Extract and store memories from a conversation.
   * Call this at the end of a session or periodically.
   */
  async autoCapture(
    messages: Array<{ role: string; content: string }>,
    scope?: string
  ): Promise<number> {
    if (!this.initialized || !this.config.autoCapture) return 0;

    try {
      const effectiveScope = scope || this.config.scopes?.default || "global";
      let stored = 0;

      if (this.smartExtractor) {
        // Smart extraction path
        const extracted = await this.smartExtractor.extract(messages);
        for (const memory of extracted) {
          if (isNoise(memory.text)) continue;
          
          const metadata = buildSmartMetadata({
            category: memory.category,
            importance: memory.importance,
          });

          await this.store!.store({
            text: memory.text,
            vector: await this.embedder.embed(memory.text),
            category: memory.category,
            scope: effectiveScope,
            importance: memory.importance,
            timestamp: Date.now(),
            metadata: stringifySmartMetadata(metadata),
          });
          stored++;
        }
      } else {
        // Regex fallback: extract from last user message
        const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
        if (lastUserMsg && !isNoise(lastUserMsg.content)) {
          const metadata = buildSmartMetadata({ category: "other", importance: 0.5 });
          await this.store!.store({
            text: lastUserMsg.content.slice(0, 500),
            vector: await this.embedder.embed(lastUserMsg.content.slice(0, 500)),
            category: "other",
            scope: effectiveScope,
            importance: 0.5,
            timestamp: Date.now(),
            metadata: stringifySmartMetadata(metadata),
          });
          stored++;
        }
      }

      if (stored > 0) {
        this.logger.debug(`hermes-memory-lancedb: auto-captured ${stored} memories`);
      }
      return stored;
    } catch (err) {
      this.logger.warn(`hermes-memory-lancedb: auto-capture failed: ${err}`);
      return 0;
    }
  }

  // ========================================================================
  // Direct API (for agent tools)
  // ========================================================================

  async recall(query: string, options?: { scope?: string; topK?: number }): Promise<any[]> {
    if (!this.initialized) await this.initialize();
    return this.retriever.search(query, {
      scope: options?.scope || this.config.scopes?.default || "global",
      topK: options?.topK || 5,
    });
  }

  async store(text: string, options?: {
    category?: string;
    scope?: string;
    importance?: number;
  }): Promise<string> {
    if (!this.initialized) await this.initialize();

    const category = options?.category || "other";
    const scope = options?.scope || this.config.scopes?.default || "global";
    const importance = options?.importance || 0.5;

    const metadata = buildSmartMetadata({ category, importance });
    const vector = await this.embedder.embed(text);

    const id = await this.store!.store({
      text,
      vector,
      category,
      scope,
      importance,
      timestamp: Date.now(),
      metadata: stringifySmartMetadata(metadata),
    });

    return id;
  }

  async forget(id: string): Promise<boolean> {
    if (!this.initialized) return false;
    return this.store!.delete(id);
  }

  async stats(): Promise<any> {
    if (!this.initialized) return { initialized: false };
    return {
      initialized: true,
      ...(await this.store!.stats()),
    };
  }

  // ========================================================================
  // Lifecycle Maintenance
  // ========================================================================

  /**
   * Run decay + tier evaluation on all memories.
   * Call periodically (e.g., daily cron).
   */
  async runLifecycleMaintenance(): Promise<void> {
    if (!this.initialized) return;

    try {
      this.logger.debug("hermes-memory-lancedb: running lifecycle maintenance...");
      
      // Score all memories with decay
      const scored = await this.decayEngine.scoreAll(this.store!);
      
      // Evaluate tier promotions/demotions
      await this.tierManager.evaluateAll(this.store!, scored);
      
      this.logger.info("hermes-memory-lancedb: lifecycle maintenance complete");
    } catch (err) {
      this.logger.warn(`hermes-memory-lancedb: lifecycle maintenance failed: ${err}`);
    }
  }
}

// ============================================================================
// Factory
// ============================================================================

export function createHermesMemoryEngine(
  config: Partial<HermesMemoryConfig>,
  logger?: HermesLogger
): HermesMemoryEngine {
  return new HermesMemoryEngine(config, logger);
}
