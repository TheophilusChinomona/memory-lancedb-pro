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
import { type SessionRegistryEntry } from "./session-recovery.js";
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
        definitions?: Record<string, {
            description: string;
        }>;
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
export declare class HermesMemoryEngine {
    private config;
    private hermesHome;
    private logger;
    private store;
    private embedder;
    private retriever;
    private scopeManager;
    private smartExtractor;
    private decayEngine;
    private tierManager;
    private llmClient;
    private sessionConfig;
    private initialized;
    constructor(config: Partial<HermesMemoryConfig>, logger?: HermesLogger);
    initialize(): Promise<void>;
    /**
     * Look up or create a session for a given platform/channel/thread.
     * This is the core fix for the "session expiry" problem.
     */
    resolveSession(ctx: HermesSessionContext): {
        sessionKey: string;
        entry: SessionRegistryEntry | null;
        isNew: boolean;
    };
    /**
     * Mark a session as dormant (keeps it resumable, unlike expiry).
     */
    sessionDormant(platform: string, channelId: string, threadId?: string): void;
    /**
     * Retrieve relevant memories for injection into the current prompt.
     * Call this before building the system prompt.
     */
    autoRecall(messageText: string, scope?: string): Promise<string | null>;
    /**
     * Extract and store memories from a conversation.
     * Call this at the end of a session or periodically.
     */
    autoCapture(messages: Array<{
        role: string;
        content: string;
    }>, scope?: string): Promise<number>;
    recall(query: string, options?: {
        scope?: string;
        topK?: number;
    }): Promise<any[]>;
    store(text: string, options?: {
        category?: string;
        scope?: string;
        importance?: number;
    }): Promise<string>;
    forget(id: string): Promise<boolean>;
    stats(): Promise<any>;
    /**
     * Run decay + tier evaluation on all memories.
     * Call periodically (e.g., daily cron).
     */
    runLifecycleMaintenance(): Promise<void>;
}
export declare function createHermesMemoryEngine(config: Partial<HermesMemoryConfig>, logger?: HermesLogger): HermesMemoryEngine;
//# sourceMappingURL=hermes-plugin.d.ts.map