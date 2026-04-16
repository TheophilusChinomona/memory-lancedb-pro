/**
 * Retrieval Statistics — Aggregate query metrics
 *
 * Collects per-query traces and produces aggregate statistics
 * for monitoring retrieval quality and performance.
 */
import type { RetrievalTrace } from "./retrieval-trace.js";
export interface AggregateStats {
    /** Total number of queries recorded */
    totalQueries: number;
    /** Number of queries that returned zero results */
    zeroResultQueries: number;
    /** Average latency across all queries (ms) */
    avgLatencyMs: number;
    /** 95th percentile latency (ms) */
    p95LatencyMs: number;
    /** Average number of results returned */
    avgResultCount: number;
    /** Number of queries where reranking was applied */
    rerankUsed: number;
    /** Number of queries where noise filter removed results */
    noiseFiltered: number;
    /** Query counts broken down by source */
    queriesBySource: Record<string, number>;
    /** Stages that drop the most entries across all queries */
    topDropStages: {
        name: string;
        totalDropped: number;
    }[];
}
export declare class RetrievalStatsCollector {
    private _records;
    private _head;
    private _count;
    private readonly _maxRecords;
    constructor(maxRecords?: number);
    /**
     * Record a completed query trace.
     * @param trace - The finalized retrieval trace
     * @param source - Query source identifier (e.g. "manual", "auto-recall")
     */
    recordQuery(trace: RetrievalTrace, source: string): void;
    /** Return records in insertion order (oldest → newest). Used by getStats(). */
    private _getRecords;
    /**
     * Compute aggregate statistics from all recorded queries.
     * Iterates ring buffer directly — avoids intermediate array allocation from _getRecords().
     */
    getStats(): AggregateStats;
    /**
     * Reset all collected statistics.
     */
    reset(): void;
    /** Number of recorded queries. */
    get count(): number;
}
//# sourceMappingURL=retrieval-stats.d.ts.map