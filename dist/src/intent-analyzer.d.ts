/**
 * Intent Analyzer for Adaptive Recall
 *
 * Lightweight, rule-based intent analysis that determines which memory categories
 * are most relevant for a given query and what recall depth to use.
 *
 * Inspired by OpenViking's hierarchical retrieval intent routing, adapted for
 * memory-lancedb-pro's flat category model. No LLM calls — pure pattern matching
 * for minimal latency impact on auto-recall.
 *
 * @see https://github.com/volcengine/OpenViking — hierarchical_retriever.py intent analysis
 */
/**
 * Intent categories map to actual stored MemoryEntry categories.
 * Note: "event" is NOT a stored category — event queries route to
 * entity + decision (the categories most likely to contain timeline data).
 */
export type MemoryCategoryIntent = "preference" | "fact" | "decision" | "entity" | "other";
export type RecallDepth = "l0" | "l1" | "full";
export interface IntentSignal {
    /** Categories to prioritize (ordered by relevance). */
    categories: MemoryCategoryIntent[];
    /** Recommended recall depth for this intent. */
    depth: RecallDepth;
    /** Confidence level of the intent classification. */
    confidence: "high" | "medium" | "low";
    /** Short label for logging. */
    label: string;
}
/**
 * Analyze a query to determine which memory categories and recall depth
 * are most appropriate.
 *
 * Returns a default "broad" signal if no specific intent is detected,
 * so callers can always use the result without null checks.
 */
export declare function analyzeIntent(query: string): IntentSignal;
/**
 * Apply intent-based category boost to retrieval results.
 *
 * Instead of filtering (which would lose potentially relevant results),
 * this boosts scores of results matching the detected intent categories.
 * Non-matching results are kept but ranked lower.
 *
 * @param results - Retrieval results with scores
 * @param intent - Detected intent signal
 * @param boostFactor - Score multiplier for matching categories (default: 1.15)
 * @returns Results with adjusted scores, re-sorted
 */
export declare function applyCategoryBoost<T extends {
    entry: {
        category: string;
    };
    score: number;
}>(results: T[], intent: IntentSignal, boostFactor?: number): T[];
/**
 * Format a memory entry for context injection at the specified depth level.
 *
 * - l0: One-line summary (category + scope + truncated text)
 * - l1: Medium detail (category + scope + text up to ~300 chars)
 * - full: Complete text (existing behavior)
 */
export declare function formatAtDepth(entry: {
    text: string;
    category: string;
    scope: string;
}, depth: RecallDepth, score: number, index: number, extra?: {
    bm25Hit?: boolean;
    reranked?: boolean;
    sanitize?: (text: string) => string;
}): string;
//# sourceMappingURL=intent-analyzer.d.ts.map