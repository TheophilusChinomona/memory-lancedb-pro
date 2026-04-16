/**
 * Retrieval Trace — Observable pipeline diagnostics
 *
 * Tracks entry IDs through each retrieval stage, computes drops,
 * score ranges, and timing. Zero overhead when not used.
 */
export interface RetrievalStageResult {
    /** Stage name, e.g. "vector_search", "bm25_search", "rrf_fusion" */
    name: string;
    /** Number of entries entering this stage */
    inputCount: number;
    /** Number of entries surviving this stage */
    outputCount: number;
    /** IDs that were present in input but not in output */
    droppedIds: string[];
    /** [min, max] score range of surviving entries, null if no scores */
    scoreRange: [number, number] | null;
    /** Wall-clock duration of this stage in milliseconds */
    durationMs: number;
}
export interface RetrievalTrace {
    /** The original search query */
    query: string;
    /** Retrieval mode used */
    mode: "hybrid" | "vector" | "bm25";
    /** Timestamp when retrieval started (epoch ms) */
    startedAt: number;
    /** Per-stage results in pipeline order */
    stages: RetrievalStageResult[];
    /** Number of results after all stages */
    finalCount: number;
    /** Total wall-clock time in milliseconds */
    totalMs: number;
}
export declare class TraceCollector {
    private readonly _startTime;
    private readonly _stages;
    private _pending;
    constructor();
    /**
     * Begin tracking a pipeline stage.
     * @param name - Stage identifier (e.g. "vector_search")
     * @param entryIds - IDs of entries entering this stage
     */
    startStage(name: string, entryIds: string[]): void;
    /**
     * End the current stage.
     * @param survivingIds - IDs of entries that survived this stage
     * @param scores - Optional scores for surviving entries (parallel to survivingIds)
     */
    endStage(survivingIds: string[], scores?: number[]): void;
    /**
     * Finalize the trace and produce the complete RetrievalTrace object.
     */
    finalize(query: string, mode: string): RetrievalTrace;
    /**
     * Produce a human-readable summary of the trace.
     */
    summarize(): string;
    /** Access collected stages (read-only). */
    get stages(): readonly RetrievalStageResult[];
}
//# sourceMappingURL=retrieval-trace.d.ts.map