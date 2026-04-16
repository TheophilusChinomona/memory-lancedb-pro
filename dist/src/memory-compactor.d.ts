/**
 * Memory Compactor — Progressive Summarization
 *
 * Identifies clusters of semantically similar memories older than a configured
 * age threshold and merges each cluster into a single, higher-quality entry.
 *
 * Implements the "progressive summarization" pattern: memories get more refined
 * over time as related fragments are consolidated, reducing noise and improving
 * retrieval quality without requiring an external LLM call.
 *
 * Algorithm:
 *   1. Load memories older than `minAgeDays` (with vectors).
 *   2. Build similarity clusters using greedy cosine-similarity expansion.
 *   3. For each cluster >= `minClusterSize`, merge into one entry:
 *        - text:       deduplicated lines joined with newlines
 *        - importance: max of cluster members (never downgrade)
 *        - category:   plurality vote
 *        - scope:      shared scope (all members must share one)
 *        - metadata:   marked { compacted: true, sourceCount: N }
 *   4. Delete source entries, store merged entry.
 */
import type { MemoryEntry } from "./store.js";
export interface CompactionConfig {
    /** Enable automatic compaction. Default: false */
    enabled: boolean;
    /** Only compact memories at least this many days old. Default: 7 */
    minAgeDays: number;
    /** Cosine similarity threshold for clustering [0, 1]. Default: 0.88 */
    similarityThreshold: number;
    /** Minimum number of memories in a cluster to trigger merge. Default: 2 */
    minClusterSize: number;
    /** Maximum memories to scan per compaction run. Default: 200 */
    maxMemoriesToScan: number;
    /** Report plan without writing changes. Default: false */
    dryRun: boolean;
    /** Run at most once per N hours (gateway_start guard). Default: 24 */
    cooldownHours: number;
}
export interface CompactionEntry {
    id: string;
    text: string;
    vector: number[];
    category: MemoryEntry["category"];
    scope: string;
    importance: number;
    timestamp: number;
    metadata: string;
}
export interface ClusterPlan {
    /** Indices into the input entries array */
    memberIndices: number[];
    /** Proposed merged entry (without id/vector — computed by caller) */
    merged: {
        text: string;
        importance: number;
        category: MemoryEntry["category"];
        scope: string;
        metadata: string;
    };
}
export interface CompactionResult {
    /** Memories scanned (limited by maxMemoriesToScan) */
    scanned: number;
    /** Clusters found with >= minClusterSize members */
    clustersFound: number;
    /** Source memories deleted (0 when dryRun) */
    memoriesDeleted: number;
    /** Merged memories created (0 when dryRun) */
    memoriesCreated: number;
    /** Whether this was a dry run */
    dryRun: boolean;
}
/**
 * Cosine similarity in [0, 1].
 * Returns 0 if either vector has zero norm (avoids NaN).
 */
export declare function cosineSimilarity(a: number[], b: number[]): number;
/**
 * Greedy cluster expansion.
 *
 * Sort entries by importance DESC so the most valuable memory seeds each
 * cluster. Expand each seed by collecting every unassigned entry whose
 * cosine similarity with the seed is >= threshold.
 *
 * Returns an array of index-arrays (each inner array = one cluster).
 * Only clusters with >= minClusterSize entries are returned.
 */
export declare function buildClusters(entries: CompactionEntry[], threshold: number, minClusterSize: number): ClusterPlan[];
/**
 * Merge a cluster of entries into a single proposed entry.
 *
 * Text strategy: deduplicate lines across all member texts, join with newline.
 * This preserves all unique information while removing redundancy.
 *
 * Importance: max across cluster (never downgrade).
 * Category: plurality vote; ties broken by member with highest importance.
 * Scope: all members must share a scope (validated upstream).
 */
export declare function buildMergedEntry(members: CompactionEntry[]): ClusterPlan["merged"];
export interface CompactorStore {
    fetchForCompaction(maxTimestamp: number, scopeFilter?: string[], limit?: number): Promise<CompactionEntry[]>;
    store(entry: {
        text: string;
        vector: number[];
        importance: number;
        category: MemoryEntry["category"];
        scope: string;
        metadata?: string;
    }): Promise<MemoryEntry>;
    delete(id: string, scopeFilter?: string[]): Promise<boolean>;
}
export interface CompactorEmbedder {
    embedPassage(text: string): Promise<number[]>;
}
export interface CompactorLogger {
    info(msg: string): void;
    warn(msg: string): void;
}
/**
 * Run a single compaction pass over memories in the given scopes.
 *
 * @param store     Storage backend (must support fetchForCompaction + store + delete)
 * @param embedder  Used to embed merged text before storage
 * @param config    Compaction configuration
 * @param scopes    Scope filter; undefined = all scopes
 * @param logger    Optional logger
 */
export declare function runCompaction(store: CompactorStore, embedder: CompactorEmbedder, config: CompactionConfig, scopes?: string[], logger?: CompactorLogger): Promise<CompactionResult>;
/**
 * Check whether enough time has passed since the last compaction run.
 * Uses a simple JSON file at `stateFile` to persist the last-run timestamp.
 */
export declare function shouldRunCompaction(stateFile: string, cooldownHours: number): Promise<boolean>;
export declare function recordCompactionRun(stateFile: string): Promise<void>;
//# sourceMappingURL=memory-compactor.d.ts.map