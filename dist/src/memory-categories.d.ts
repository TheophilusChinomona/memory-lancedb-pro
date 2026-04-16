/**
 * Memory Categories — 6-category classification system
 *
 * UserMemory: profile, preferences, entities, events
 * AgentMemory: cases, patterns
 */
export declare const MEMORY_CATEGORIES: readonly ["profile", "preferences", "entities", "events", "cases", "patterns"];
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];
/** Categories that always merge (skip dedup entirely). */
export declare const ALWAYS_MERGE_CATEGORIES: Set<"profile" | "preferences" | "entities" | "events" | "cases" | "patterns">;
/** Categories that support MERGE decision from LLM dedup. */
export declare const MERGE_SUPPORTED_CATEGORIES: Set<"profile" | "preferences" | "entities" | "events" | "cases" | "patterns">;
/** Categories whose facts can be replaced over time without deleting history. */
export declare const TEMPORAL_VERSIONED_CATEGORIES: Set<"profile" | "preferences" | "entities" | "events" | "cases" | "patterns">;
/** Categories that are append-only (CREATE or SKIP only, no MERGE). */
export declare const APPEND_ONLY_CATEGORIES: Set<"profile" | "preferences" | "entities" | "events" | "cases" | "patterns">;
/** Memory tier levels for lifecycle management. */
export type MemoryTier = "core" | "working" | "peripheral";
/** A candidate memory extracted from conversation by LLM. */
export type CandidateMemory = {
    category: MemoryCategory;
    abstract: string;
    overview: string;
    content: string;
};
/** Dedup decision from LLM. */
export type DedupDecision = "create" | "merge" | "skip" | "support" | "contextualize" | "contradict" | "supersede";
export type DedupResult = {
    decision: DedupDecision;
    reason: string;
    matchId?: string;
    contextLabel?: string;
};
export type ExtractionStats = {
    created: number;
    merged: number;
    skipped: number;
    rejected?: number;
    boundarySkipped?: number;
    supported?: number;
    superseded?: number;
};
/** Validate and normalize a category string. */
export declare function normalizeCategory(raw: string): MemoryCategory | null;
//# sourceMappingURL=memory-categories.d.ts.map