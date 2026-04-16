/**
 * Migration Utilities
 * Migrates data from old memory-lancedb plugin to memory-lancedb-pro
 */
import type { MemoryStore } from "./store.js";
interface MigrationResult {
    success: boolean;
    migratedCount: number;
    skippedCount: number;
    errors: string[];
    summary: string;
}
interface MigrationOptions {
    sourceDbPath?: string;
    dryRun?: boolean;
    defaultScope?: string;
    skipExisting?: boolean;
}
export declare class MemoryMigrator {
    private targetStore;
    constructor(targetStore: MemoryStore);
    migrate(options?: MigrationOptions): Promise<MigrationResult>;
    private findSourceDatabase;
    private loadLegacyData;
    private migrateEntries;
    checkMigrationNeeded(sourceDbPath?: string): Promise<{
        needed: boolean;
        sourceFound: boolean;
        sourceDbPath?: string;
        entryCount?: number;
    }>;
    verifyMigration(sourceDbPath?: string): Promise<{
        valid: boolean;
        sourceCount: number;
        targetCount: number;
        issues: string[];
    }>;
}
export declare function createMigrator(targetStore: MemoryStore): MemoryMigrator;
export declare function migrateFromLegacy(targetStore: MemoryStore, options?: MigrationOptions): Promise<MigrationResult>;
export declare function checkForLegacyData(): Promise<{
    found: boolean;
    paths: string[];
    totalEntries: number;
}>;
export {};
//# sourceMappingURL=migrate.d.ts.map