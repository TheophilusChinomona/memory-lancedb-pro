/**
 * Batch-Internal Dedup — Cosine similarity dedup within extraction batches
 *
 * Before running expensive per-candidate LLM dedup calls, this module
 * checks all candidates against each other using cosine similarity
 * on their embedded abstracts. Candidates with similarity > threshold
 * are marked as batch duplicates and skipped.
 *
 * For n <= 5 candidates, O(n^2) pairwise comparison is trivial.
 */
export interface BatchDedupCandidate {
    /** Unique index within the batch */
    index: number;
    /** L0 abstract text used for embedding */
    abstract: string;
    /** Embedded vector of the abstract */
    vector?: number[];
    /** Whether this candidate was marked as a batch duplicate */
    isBatchDuplicate: boolean;
    /** If duplicate, index of the surviving candidate it duplicates */
    duplicateOf?: number;
}
export interface BatchDedupResult {
    /** Indices of candidates that survived (not duplicates) */
    survivingIndices: number[];
    /** Indices of candidates marked as batch duplicates */
    duplicateIndices: number[];
    /** Number of candidates before dedup */
    inputCount: number;
    /** Number of candidates after dedup */
    outputCount: number;
}
export interface ExtractionCostStats {
    /** Candidates dropped by batch dedup */
    batchDeduped: number;
    /** Total extraction wall time in ms */
    durationMs: number;
    /** Count of LLM invocations */
    llmCalls: number;
}
/**
 * Perform batch-internal cosine dedup on candidate abstracts.
 *
 * @param abstracts - Array of L0 abstract strings from extracted candidates
 * @param vectors - Parallel array of embedded vectors for each abstract
 * @param threshold - Cosine similarity threshold above which candidates are considered duplicates (default: 0.85)
 * @returns BatchDedupResult with surviving and duplicate indices
 */
export declare function batchDedup(abstracts: string[], vectors: number[][], threshold?: number): BatchDedupResult;
/**
 * Create a fresh ExtractionCostStats tracker.
 */
export declare function createExtractionCostStats(): ExtractionCostStats;
//# sourceMappingURL=batch-dedup.d.ts.map