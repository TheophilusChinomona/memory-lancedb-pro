/**
 * Tier Manager — Three-tier memory promotion/demotion system
 *
 * Tiers:
 * - Core (decay floor 0.9): Identity-level facts, almost never forgotten
 * - Working (decay floor 0.7): Active context, ages out without reinforcement
 * - Peripheral (decay floor 0.5): Low-priority or aging memories
 *
 * Promotion: Peripheral → Working → Core (based on access, composite score, importance)
 * Demotion: Core → Working → Peripheral (based on decay, age)
 */
import type { MemoryTier } from "./memory-categories.js";
import type { DecayScore } from "./decay-engine.js";
export interface TierConfig {
    /** Minimum access count for Core promotion (default: 10) */
    coreAccessThreshold: number;
    /** Minimum composite decay score for Core promotion (default: 0.7) */
    coreCompositeThreshold: number;
    /** Minimum importance for Core promotion (default: 0.8) */
    coreImportanceThreshold: number;
    /** Composite threshold below which to demote to Peripheral (default: 0.15) */
    peripheralCompositeThreshold: number;
    /** Age in days after which infrequent memories demote to Peripheral (default: 60) */
    peripheralAgeDays: number;
    /** Minimum access count for Working promotion from Peripheral (default: 3) */
    workingAccessThreshold: number;
    /** Minimum composite for Working promotion from Peripheral (default: 0.4) */
    workingCompositeThreshold: number;
}
export declare const DEFAULT_TIER_CONFIG: TierConfig;
export interface TierTransition {
    memoryId: string;
    fromTier: MemoryTier;
    toTier: MemoryTier;
    reason: string;
}
/** Minimal memory fields needed for tier evaluation. */
export interface TierableMemory {
    id: string;
    tier: MemoryTier;
    importance: number;
    accessCount: number;
    createdAt: number;
}
export interface TierManager {
    /**
     * Evaluate whether a memory should change tiers.
     * Returns the transition if a change is needed, null otherwise.
     */
    evaluate(memory: TierableMemory, decayScore: DecayScore, now?: number): TierTransition | null;
    /**
     * Evaluate multiple memories and return all transitions.
     */
    evaluateAll(memories: TierableMemory[], decayScores: DecayScore[], now?: number): TierTransition[];
}
export declare function createTierManager(config?: TierConfig): TierManager;
//# sourceMappingURL=tier-manager.d.ts.map