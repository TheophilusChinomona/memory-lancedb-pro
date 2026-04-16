/**
 * Hybrid Retrieval System
 * Combines vector search + BM25 full-text search with RRF fusion
 */
import type { MemoryStore, MemorySearchResult } from "./store.js";
import type { Embedder } from "./embedder.js";
import { AccessTracker } from "./access-tracker.js";
import type { DecayEngine } from "./decay-engine.js";
import type { TierManager } from "./tier-manager.js";
import { type RetrievalTrace } from "./retrieval-trace.js";
import { RetrievalStatsCollector } from "./retrieval-stats.js";
export interface RetrievalConfig {
    mode: "hybrid" | "vector";
    vectorWeight: number;
    bm25Weight: number;
    /** Expand BM25 queries with high-signal synonyms for manual / CLI retrieval. */
    queryExpansion: boolean;
    minScore: number;
    rerank: "cross-encoder" | "lightweight" | "none";
    candidatePoolSize: number;
    /** Recency boost half-life in days (default: 14). Set 0 to disable. */
    recencyHalfLifeDays: number;
    /** Max recency boost factor (default: 0.10) */
    recencyWeight: number;
    /** Filter noise from results (default: true) */
    filterNoise: boolean;
    /** Reranker API key (enables cross-encoder reranking) */
    rerankApiKey?: string;
    /** Reranker model (default: jina-reranker-v3) */
    rerankModel?: string;
    /** Reranker API endpoint (default: https://api.jina.ai/v1/rerank). */
    rerankEndpoint?: string;
    /** Reranker provider format. Determines request/response shape and auth header.
     *  - "jina" (default): Authorization: Bearer, string[] documents, results[].relevance_score
     *  - "siliconflow": same format as jina (alias, for clarity)
     *  - "voyage": Authorization: Bearer, string[] documents, data[].relevance_score
     *  - "pinecone": Api-Key header, {text}[] documents, data[].score
     *  - "tei": Authorization: Bearer, string[] texts, top-level [{ index, score }] */
    rerankProvider?: "jina" | "siliconflow" | "voyage" | "pinecone" | "dashscope" | "tei";
    /** Rerank API timeout in milliseconds (default: 5000). Increase for local/CPU-based rerank servers. */
    rerankTimeoutMs?: number;
    /**
     * Length normalization: penalize long entries that dominate via sheer keyword
     * density. Formula: score *= 1 / (1 + log2(charLen / anchor)).
     * anchor = reference length (default: 500 chars). Entries shorter than anchor
     * get a slight boost; longer entries get penalized progressively.
     * Set 0 to disable. (default: 300)
     */
    lengthNormAnchor: number;
    /**
     * Hard cutoff after rerank: discard results below this score.
     * Applied after all scoring stages (rerank, recency, importance, length norm).
     * Higher = fewer but more relevant results. (default: 0.35)
     */
    hardMinScore: number;
    /**
     * Time decay half-life in days. Entries older than this lose score.
     * Different from recencyBoost (additive bonus for new entries):
     * this is a multiplicative penalty for old entries.
     * Formula: score *= 0.5 + 0.5 * exp(-ageDays / halfLife)
     * At halfLife days: ~0.68x. At 2*halfLife: ~0.59x. At 4*halfLife: ~0.52x.
     * Set 0 to disable. (default: 60)
     */
    timeDecayHalfLifeDays: number;
    /** Access reinforcement factor for time decay half-life extension.
     *  Higher = stronger reinforcement. 0 to disable. (default: 0.5) */
    reinforcementFactor: number;
    /** Maximum half-life multiplier from access reinforcement.
     *  Prevents frequently accessed memories from becoming immortal. (default: 3) */
    maxHalfLifeMultiplier: number;
    /** Tag prefixes for exact-match queries (default: ["proj", "env", "team", "scope"]).
     *  Queries containing these prefixes (e.g. "proj:AIF") will use BM25-only + mustContain
     *  to avoid semantic false positives from vector search. */
    tagPrefixes: string[];
}
export interface RetrievalContext {
    query: string;
    limit: number;
    scopeFilter?: string[];
    category?: string;
    /** Retrieval source: "manual" for user-triggered, "auto-recall" for system-initiated, "cli" for CLI commands. */
    source?: "manual" | "auto-recall" | "cli";
}
export interface RetrievalResult extends MemorySearchResult {
    sources: {
        vector?: {
            score: number;
            rank: number;
        };
        bm25?: {
            score: number;
            rank: number;
        };
        fused?: {
            score: number;
        };
        reranked?: {
            score: number;
        };
    };
}
export interface RetrievalDiagnostics {
    source?: RetrievalContext["source"];
    mode: RetrievalConfig["mode"];
    originalQuery: string;
    bm25Query: string | null;
    queryExpanded: boolean;
    limit: number;
    scopeFilter?: string[];
    category?: string;
    vectorResultCount: number;
    bm25ResultCount: number;
    fusedResultCount: number;
    finalResultCount: number;
    stageCounts: {
        afterMinScore: number;
        rerankInput: number;
        afterRerank: number;
        afterRecency: number;
        afterImportance: number;
        afterLengthNorm: number;
        afterTimeDecay: number;
        afterHardMinScore: number;
        afterNoiseFilter: number;
        afterDiversity: number;
    };
    dropSummary: Array<{
        stage: "minScore" | "rerankWindow" | "rerank" | "recencyBoost" | "importanceWeight" | "lengthNorm" | "timeDecay" | "hardMinScore" | "noiseFilter" | "diversity" | "limit";
        before: number;
        after: number;
        dropped: number;
    }>;
    failureStage?: "vector.embedQuery" | "vector.vectorSearch" | "vector.postProcess" | "hybrid.embedQuery" | "hybrid.vectorSearch" | "hybrid.bm25Search" | "hybrid.parallelSearch" | "hybrid.fuseResults" | "hybrid.rerank" | "hybrid.postProcess";
    errorMessage?: string;
}
export declare const DEFAULT_RETRIEVAL_CONFIG: RetrievalConfig;
export declare class MemoryRetriever {
    private store;
    private embedder;
    private config;
    private decayEngine;
    private accessTracker;
    private lastDiagnostics;
    private tierManager;
    private _statsCollector;
    constructor(store: MemoryStore, embedder: Embedder, config?: RetrievalConfig, decayEngine?: DecayEngine | null);
    setAccessTracker(tracker: AccessTracker): void;
    /** Enable aggregate retrieval statistics collection. */
    setStatsCollector(collector: RetrievalStatsCollector): void;
    /** Get the stats collector (if set). */
    getStatsCollector(): RetrievalStatsCollector | null;
    retrieve(context: RetrievalContext): Promise<RetrievalResult[]>;
    /**
     * Retrieve with full trace, used by the memory_debug tool.
     * Always collects a trace regardless of stats collector state.
     */
    retrieveWithTrace(context: RetrievalContext): Promise<{
        results: RetrievalResult[];
        trace: RetrievalTrace;
    }>;
    private extractTagTokens;
    private vectorOnlyRetrieval;
    private bm25OnlyRetrieval;
    private hybridRetrieval;
    private runVectorSearch;
    private runBM25Search;
    private buildBM25Query;
    private fuseResults;
    /**
     * Rerank results using cross-encoder API (Jina, Pinecone, or compatible).
     * Falls back to cosine similarity if API is unavailable or fails.
     */
    private rerankResults;
    private getRerankPreservationFloor;
    /**
     * Apply recency boost: newer memories get a small score bonus.
     * This ensures corrections/updates naturally outrank older entries
     * when semantic similarity is close.
     * Formula: boost = exp(-ageDays / halfLife) * weight
     */
    private applyRecencyBoost;
    /**
     * Apply importance weighting: memories with higher importance get a score boost.
     * This ensures critical memories (importance=1.0) outrank casual ones (importance=0.5)
     * when semantic similarity is close.
     * Formula: score *= (baseWeight + (1 - baseWeight) * importance)
     * With baseWeight=0.7: importance=1.0 → ×1.0, importance=0.5 → ×0.85, importance=0.0 → ×0.7
     */
    private applyImportanceWeight;
    private applyDecayBoost;
    /**
     * Length normalization: penalize long entries that dominate search results
     * via sheer keyword density and broad semantic coverage.
     * Short, focused entries (< anchor) get a slight boost.
     * Long, sprawling entries (> anchor) get penalized.
     * Formula: score *= 1 / (1 + log2(charLen / anchor))
     */
    private applyLengthNormalization;
    /**
     * Time decay: multiplicative penalty for old entries.
     * Unlike recencyBoost (additive bonus for new entries), this actively
     * penalizes stale information so recent knowledge wins ties.
     * Formula: score *= 0.5 + 0.5 * exp(-ageDays / halfLife)
     * At 0 days: 1.0x (no penalty)
     * At halfLife: ~0.68x
     * At 2*halfLife: ~0.59x
     * Floor at 0.5x (never penalize more than half)
     */
    private applyTimeDecay;
    /**
     * Apply lifecycle-aware score adjustment (decay + tier floors).
     *
     * This is intentionally lightweight:
     * - reads tier/access metadata (if any)
     * - multiplies scores by max(tierFloor, decayComposite)
     */
    private applyLifecycleBoost;
    /**
     * Record access stats (access_count, last_accessed_at) and apply tier
     * promotion/demotion for a small number of top results.
     *
     * Note: this writes back to LanceDB via delete+readd; keep it bounded.
     */
    private recordAccessAndMaybeTransition;
    /**
     * MMR-inspired diversity filter: greedily select results that are both
     * relevant (high score) and diverse (low similarity to already-selected).
     *
     * Uses cosine similarity between memory vectors. If two memories have
     * cosine similarity > threshold (default 0.92), the lower-scored one
     * is demoted to the end rather than removed entirely.
     *
     * This prevents top-k from being filled with near-identical entries
     * (e.g. 3 similar "SVG style" memories) while keeping them available
     * if the pool is small.
     */
    private applyMMRDiversity;
    updateConfig(newConfig: Partial<RetrievalConfig>): void;
    getConfig(): RetrievalConfig;
    getLastDiagnostics(): RetrievalDiagnostics | null;
    test(query?: string): Promise<{
        success: boolean;
        mode: string;
        hasFtsSupport: boolean;
        error?: string;
    }>;
}
export interface RetrieverLifecycleOptions {
    decayEngine?: DecayEngine;
    tierManager?: TierManager;
}
export declare function createRetriever(store: MemoryStore, embedder: Embedder, config?: Partial<RetrievalConfig>, options?: {
    decayEngine?: DecayEngine | null;
}): MemoryRetriever;
//# sourceMappingURL=retriever.d.ts.map