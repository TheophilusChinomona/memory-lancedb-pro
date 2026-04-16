import { type MemoryCategory, type MemoryTier } from "./memory-categories.js";
import type { DecayableMemory } from "./decay-engine.js";
type LegacyStoreCategory = "preference" | "fact" | "decision" | "entity" | "other" | "reflection";
type EntryLike = {
    text?: string;
    category?: LegacyStoreCategory;
    importance?: number;
    timestamp?: number;
    metadata?: string;
};
export interface MemoryRelation {
    type: string;
    targetId: string;
}
export type MemoryState = "pending" | "confirmed" | "archived";
export type MemoryLayer = "durable" | "working" | "reflection" | "archive";
export type MemorySource = "manual" | "auto-capture" | "reflection" | "session-summary" | "legacy";
export interface SmartMemoryMetadata {
    l0_abstract: string;
    l1_overview: string;
    l2_content: string;
    memory_category: MemoryCategory;
    tier: MemoryTier;
    access_count: number;
    confidence: number;
    last_accessed_at: number;
    valid_from: number;
    invalidated_at?: number;
    memory_temporal_type?: "static" | "dynamic";
    valid_until?: number;
    fact_key?: string;
    supersedes?: string;
    superseded_by?: string;
    relations?: MemoryRelation[];
    source_session?: string;
    state: MemoryState;
    source: MemorySource;
    memory_layer: MemoryLayer;
    injected_count: number;
    last_injected_at?: number;
    last_confirmed_use_at?: number;
    bad_recall_count: number;
    suppressed_until_turn: number;
    canonical_id?: string;
    [key: string]: unknown;
}
export interface LifecycleMemory {
    id: string;
    importance: number;
    confidence: number;
    tier: MemoryTier;
    accessCount: number;
    createdAt: number;
    lastAccessedAt: number;
    temporalType?: "static" | "dynamic";
}
export declare function reverseMapLegacyCategory(oldCategory: LegacyStoreCategory | undefined, text?: string): MemoryCategory;
export declare function deriveFactKey(category: MemoryCategory, abstract: string): string | undefined;
export declare function isMemoryActiveAt(metadata: Pick<SmartMemoryMetadata, "valid_from" | "invalidated_at">, at?: number): boolean;
/**
 * Check if a memory has passed its expiry date (valid_until).
 * Separate from isMemoryActiveAt (which checks invalidated_at from superseding).
 * Returns false if valid_until is not set (no expiry = permanent).
 */
export declare function isMemoryExpired(metadata: Pick<SmartMemoryMetadata, "valid_until">, at?: number): boolean;
export declare function parseSmartMetadata(rawMetadata: string | undefined, entry?: EntryLike): SmartMemoryMetadata;
export declare function buildSmartMetadata(entry: EntryLike, patch?: Partial<SmartMemoryMetadata>): SmartMemoryMetadata;
/**
 * Append a relation to an existing relations array, deduplicating by type+targetId.
 */
export declare function appendRelation(existing: unknown, relation: MemoryRelation): MemoryRelation[];
export declare function stringifySmartMetadata(metadata: SmartMemoryMetadata | Record<string, unknown>): string;
export declare function toLifecycleMemory(id: string, entry: EntryLike): LifecycleMemory;
/**
 * Parse a memory entry into both a DecayableMemory (for the decay engine)
 * and the raw SmartMemoryMetadata (for in-place mutation before write-back).
 */
export declare function getDecayableFromEntry(entry: EntryLike & {
    id?: string;
}): {
    memory: DecayableMemory;
    meta: SmartMemoryMetadata;
};
/** Predefined context vocabulary for support slices */
export declare const SUPPORT_CONTEXT_VOCABULARY: readonly ["general", "morning", "afternoon", "evening", "night", "weekday", "weekend", "work", "leisure", "summer", "winter", "travel"];
export type SupportContext = (typeof SUPPORT_CONTEXT_VOCABULARY)[number] | string;
/** Max number of context slices per memory to prevent metadata bloat */
export declare const MAX_SUPPORT_SLICES = 8;
/** A single context-specific support slice */
export interface ContextualSupport {
    context: SupportContext;
    confirmations: number;
    contradictions: number;
    strength: number;
    last_observed_at: number;
}
/** V2 support info with per-context slices */
export interface SupportInfoV2 {
    global_strength: number;
    total_observations: number;
    slices: ContextualSupport[];
}
/**
 * Normalize a raw context label to a canonical context.
 * Maps common variants (e.g. "晚上" → "evening") and falls back to "general".
 */
export declare function normalizeContext(raw: string | undefined): SupportContext;
/**
 * Parse support_info from metadata JSON. Handles V1 (flat) → V2 (sliced) migration.
 */
export declare function parseSupportInfo(raw: unknown): SupportInfoV2;
/**
 * Update support stats for a specific context.
 * Returns a new SupportInfoV2 with the updated slice.
 */
export declare function updateSupportStats(existing: SupportInfoV2, contextLabel: string | undefined, event: "support" | "contradict"): SupportInfoV2;
export {};
//# sourceMappingURL=smart-metadata.d.ts.map