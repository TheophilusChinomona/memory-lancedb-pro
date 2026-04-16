/**
 * LanceDB Storage Layer with Multi-Scope Support
 */
export interface MemoryEntry {
    id: string;
    text: string;
    vector: number[];
    category: "preference" | "fact" | "decision" | "entity" | "other" | "reflection";
    scope: string;
    importance: number;
    timestamp: number;
    metadata?: string;
}
export interface MemorySearchResult {
    entry: MemoryEntry;
    score: number;
}
export interface StoreConfig {
    dbPath: string;
    vectorDim: number;
}
export interface MetadataPatch {
    [key: string]: unknown;
}
export declare const loadLanceDB: () => Promise<typeof import("@lancedb/lancedb")>;
/**
 * Validate and prepare the storage directory before LanceDB connection.
 * Resolves symlinks, creates missing directories, and checks write permissions.
 * Returns the resolved absolute path on success, or throws a descriptive error.
 */
export declare function validateStoragePath(dbPath: string): string;
export declare class MemoryStore {
    private readonly config;
    private db;
    private table;
    private initPromise;
    private ftsIndexCreated;
    private _updating;
    private _waitQueue;
    constructor(config: StoreConfig);
    private runWithFileLock;
    get dbPath(): string;
    private ensureInitialized;
    private doInitialize;
    private createFtsIndex;
    store(entry: Omit<MemoryEntry, "id" | "timestamp">): Promise<MemoryEntry>;
    /**
     * Import a pre-built entry while preserving its id/timestamp.
     * Used for re-embedding / migration / A/B testing across embedding models.
     * Intentionally separate from `store()` to keep normal writes simple.
     */
    importEntry(entry: MemoryEntry): Promise<MemoryEntry>;
    hasId(id: string): Promise<boolean>;
    /** Lightweight total row count via LanceDB countRows(). */
    count(): Promise<number>;
    getById(id: string, scopeFilter?: string[]): Promise<MemoryEntry | null>;
    vectorSearch(vector: number[], limit?: number, minScore?: number, scopeFilter?: string[], options?: {
        excludeInactive?: boolean;
    }): Promise<MemorySearchResult[]>;
    bm25Search(query: string, limit?: number, scopeFilter?: string[], options?: {
        excludeInactive?: boolean;
    }): Promise<MemorySearchResult[]>;
    private lexicalFallbackSearch;
    delete(id: string, scopeFilter?: string[]): Promise<boolean>;
    list(scopeFilter?: string[], category?: string, limit?: number, offset?: number): Promise<MemoryEntry[]>;
    stats(scopeFilter?: string[]): Promise<{
        totalCount: number;
        scopeCounts: Record<string, number>;
        categoryCounts: Record<string, number>;
    }>;
    update(id: string, updates: {
        text?: string;
        vector?: number[];
        importance?: number;
        category?: MemoryEntry["category"];
        metadata?: string;
    }, scopeFilter?: string[]): Promise<MemoryEntry | null>;
    private runSerializedUpdate;
    patchMetadata(id: string, patch: MetadataPatch, scopeFilter?: string[]): Promise<MemoryEntry | null>;
    bulkDelete(scopeFilter: string[], beforeTimestamp?: number): Promise<number>;
    get hasFtsSupport(): boolean;
    /** Last FTS error for diagnostics */
    private _lastFtsError;
    get lastFtsError(): string | null;
    /** Get FTS index health status */
    getFtsStatus(): {
        available: boolean;
        lastError: string | null;
    };
    /** Rebuild FTS index (drops and recreates). Useful for recovery after corruption. */
    rebuildFtsIndex(): Promise<{
        success: boolean;
        error?: string;
    }>;
    /**
     * Fetch memories older than `maxTimestamp` including their raw vectors.
     * Used exclusively by the memory compactor; vectors are intentionally
     * omitted from `list()` for performance, but compaction needs them for
     * cosine-similarity clustering.
     */
    fetchForCompaction(maxTimestamp: number, scopeFilter?: string[], limit?: number): Promise<MemoryEntry[]>;
}
//# sourceMappingURL=store.d.ts.map