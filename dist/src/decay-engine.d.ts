/**
 * Decay Engine — Weibull stretched-exponential decay model
 *
 * Composite score = recencyWeight * recency + frequencyWeight * frequency + intrinsicWeight * intrinsic
 *
 * - Recency: Weibull decay with importance-modulated half-life and tier-specific beta
 * - Frequency: Logarithmic saturation with time-weighted access pattern bonus
 * - Intrinsic: importance × confidence
 */
import type { MemoryTier } from "./memory-categories.js";
export interface DecayConfig {
    /** Days until recency score halves (default: 30) */
    recencyHalfLifeDays: number;
    /** Weight of recency in composite (default: 0.4) */
    recencyWeight: number;
    /** Weight of access frequency (default: 0.3) */
    frequencyWeight: number;
    /** Weight of importance × confidence (default: 0.3) */
    intrinsicWeight: number;
    /** Below this composite = stale (default: 0.3) */
    staleThreshold: number;
    /** Minimum search boost (default: 0.3) */
    searchBoostMin: number;
    /** Importance modulation coefficient for half-life (default: 1.5) */
    importanceModulation: number;
    /** Weibull beta for Core tier — sub-exponential (default: 0.8) */
    betaCore: number;
    /** Weibull beta for Working tier — standard exponential (default: 1.0) */
    betaWorking: number;
    /** Weibull beta for Peripheral tier — super-exponential (default: 1.3) */
    betaPeripheral: number;
    /** Decay floor for Core memories (default: 0.9) */
    coreDecayFloor: number;
    /** Decay floor for Working memories (default: 0.7) */
    workingDecayFloor: number;
    /** Decay floor for Peripheral memories (default: 0.5) */
    peripheralDecayFloor: number;
}
export declare const DEFAULT_DECAY_CONFIG: DecayConfig;
export interface DecayScore {
    memoryId: string;
    recency: number;
    frequency: number;
    intrinsic: number;
    composite: number;
}
/** Minimal memory fields needed for decay calculation. */
export interface DecayableMemory {
    id: string;
    importance: number;
    confidence: number;
    tier: MemoryTier;
    accessCount: number;
    createdAt: number;
    lastAccessedAt: number;
    /** Temporal classification: "dynamic" memories decay 3x faster. */
    temporalType?: "static" | "dynamic";
}
export interface DecayEngine {
    /** Calculate decay score for a single memory */
    score(memory: DecayableMemory, now?: number): DecayScore;
    /** Calculate decay scores for multiple memories */
    scoreAll(memories: DecayableMemory[], now?: number): DecayScore[];
    /** Apply decay boost to search results (multiplies each score by boost) */
    applySearchBoost(results: Array<{
        memory: DecayableMemory;
        score: number;
    }>, now?: number): void;
    /** Find stale memories (composite below threshold) */
    getStaleMemories(memories: DecayableMemory[], now?: number): DecayScore[];
}
export declare function createDecayEngine(config?: DecayConfig): DecayEngine;
//# sourceMappingURL=decay-engine.d.ts.map