/**
 * Memory Upgrader — Convert legacy memories to new smart memory format
 *
 * Legacy memories lack L0/L1/L2 metadata, memory_category (6-category),
 * tier, access_count, and confidence fields. This module enriches them
 * to enable unified memory lifecycle management (decay, tier promotion,
 * smart dedup).
 *
 * Pipeline per memory:
 *   1. Detect legacy format (missing `memory_category` in metadata)
 *   2. Reverse-map 5-category → 6-category
 *   3. Generate L0/L1/L2 via LLM (or fallback to simple rules)
 *   4. Write enriched metadata back via store.update()
 */
import type { MemoryStore, MemoryEntry } from "./store.js";
import type { LlmClient } from "./llm-client.js";
export interface UpgradeOptions {
    /** Only report counts without modifying data (default: false) */
    dryRun?: boolean;
    /** Number of memories to process per batch (default: 10) */
    batchSize?: number;
    /** Skip LLM calls; use simple text truncation for L0/L1 (default: false) */
    noLlm?: boolean;
    /** Maximum number of memories to upgrade (default: unlimited) */
    limit?: number;
    /** Scope filter — only upgrade memories in these scopes */
    scopeFilter?: string[];
    /** Logger function */
    log?: (msg: string) => void;
}
export interface UpgradeResult {
    /** Total legacy memories found */
    totalLegacy: number;
    /** Successfully upgraded count */
    upgraded: number;
    /** Skipped (already new format) */
    skipped: number;
    /** Errors encountered */
    errors: string[];
}
export declare class MemoryUpgrader {
    private store;
    private llm;
    private options;
    private log;
    constructor(store: MemoryStore, llm: LlmClient | null, options?: UpgradeOptions);
    /**
     * Check if a memory entry is in legacy format (needs upgrade).
     * Legacy = no metadata, or metadata lacks `memory_category`.
     */
    isLegacyMemory(entry: MemoryEntry): boolean;
    /**
     * Scan and count legacy memories without modifying them.
     */
    countLegacy(scopeFilter?: string[]): Promise<{
        total: number;
        legacy: number;
        byCategory: Record<string, number>;
    }>;
    /**
     * Main upgrade entry point.
     * Scans all memories, filters legacy ones, and enriches them.
     */
    upgrade(options?: UpgradeOptions): Promise<UpgradeResult>;
    /**
     * Upgrade a single legacy memory entry.
     */
    private upgradeEntry;
}
export declare function createMemoryUpgrader(store: MemoryStore, llm: LlmClient | null, options?: UpgradeOptions): MemoryUpgrader;
//# sourceMappingURL=memory-upgrader.d.ts.map