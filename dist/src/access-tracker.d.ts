/**
 * Access Tracker
 *
 * Tracks memory access patterns to support reinforcement-based decay.
 * Frequently accessed memories decay more slowly (longer effective half-life).
 *
 * Key exports:
 * - parseAccessMetadata   — extract accessCount/lastAccessedAt from metadata JSON
 * - buildUpdatedMetadata  — merge access fields into existing metadata JSON
 * - computeEffectiveHalfLife — compute reinforced half-life from access history
 * - AccessTracker         — debounced write-back tracker for batch metadata updates
 */
import type { MemoryStore } from "./store.js";
export interface AccessMetadata {
    readonly accessCount: number;
    readonly lastAccessedAt: number;
}
export interface AccessTrackerOptions {
    readonly store: MemoryStore;
    readonly logger: {
        warn: (...args: unknown[]) => void;
        info?: (...args: unknown[]) => void;
    };
    readonly debounceMs?: number;
}
/**
 * Parse access-related fields from a metadata JSON string.
 *
 * Handles: undefined, empty string, malformed JSON, negative numbers,
 * numbers exceeding 10000. Always returns a valid AccessMetadata.
 */
export declare function parseAccessMetadata(metadata: string | undefined): AccessMetadata;
/**
 * Merge an access-count increment into existing metadata JSON.
 *
 * Preserves ALL existing fields in the metadata object — only overwrites
 * `accessCount` and `lastAccessedAt`. Returns a new JSON string.
 */
export declare function buildUpdatedMetadata(existingMetadata: string | undefined, accessDelta: number): string;
/**
 * Compute the effective half-life for a memory based on its access history.
 *
 * The access count itself decays over time (30-day half-life for access
 * freshness), so stale accesses contribute less reinforcement. The extension
 * uses a logarithmic curve (`Math.log1p`) to provide diminishing returns.
 *
 * @param baseHalfLife        - Base half-life in days (e.g. 30)
 * @param accessCount         - Raw number of times the memory was accessed
 * @param lastAccessedAt      - Timestamp (ms) of last access
 * @param reinforcementFactor - Scaling factor for reinforcement (0 = disabled)
 * @param maxMultiplier       - Hard cap: result <= baseHalfLife * maxMultiplier
 * @returns Effective half-life in days
 */
export declare function computeEffectiveHalfLife(baseHalfLife: number, accessCount: number, lastAccessedAt: number, reinforcementFactor: number, maxMultiplier: number): number;
/**
 * Debounced write-back tracker for memory access events.
 *
 * `recordAccess()` is synchronous (Map update only, no I/O). Pending deltas
 * accumulate until `flush()` is called (or by a future scheduled callback).
 * On flush, each pending entry is read via `store.getById()`, its metadata
 * is merged with the accumulated access delta, and written back via
 * `store.update()`.
 */
export declare class AccessTracker {
    private readonly pending;
    private readonly _retryCount;
    private readonly _maxRetries;
    private debounceTimer;
    private flushPromise;
    private readonly debounceMs;
    private readonly store;
    private readonly logger;
    constructor(options: AccessTrackerOptions);
    /**
     * Record one access for each of the given memory IDs.
     * Synchronous — only updates the in-memory pending map.
     */
    recordAccess(ids: readonly string[]): void;
    /**
     * Return a snapshot of all pending (id -> delta) entries.
     */
    getPendingUpdates(): Map<string, number>;
    /**
     * Flush pending access deltas to the store.
     *
     * If a flush is already in progress, awaits the current flush to complete.
     * If new pending data accumulated during the in-flight flush, a follow-up
     * flush is automatically triggered.
     */
    flush(): Promise<void>;
    /**
     * Tear down the tracker — cancel timers and clear pending state.
     */
    destroy(): void;
    private doFlush;
    private resetTimer;
    private clearTimer;
}
//# sourceMappingURL=access-tracker.d.ts.map