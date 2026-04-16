import type { MemoryEntry, MemorySearchResult } from "./store.js";
import { type ReflectionSlices } from "./reflection-slices.js";
export declare const REFLECTION_DERIVE_LOGISTIC_MIDPOINT_DAYS = 3;
export declare const REFLECTION_DERIVE_LOGISTIC_K = 1.2;
export declare const REFLECTION_DERIVE_FALLBACK_BASE_WEIGHT = 0.35;
export declare const DEFAULT_REFLECTION_DERIVED_MAX_AGE_MS: number;
export declare const DEFAULT_REFLECTION_MAPPED_MAX_AGE_MS: number;
type ReflectionStoreKind = "event" | "item-invariant" | "item-derived" | "combined-legacy";
type ReflectionErrorSignalLike = {
    signatureHash: string;
};
interface ReflectionStorePayload {
    text: string;
    metadata: Record<string, unknown>;
    kind: ReflectionStoreKind;
}
interface BuildReflectionStorePayloadsParams {
    reflectionText: string;
    sessionKey: string;
    sessionId: string;
    agentId: string;
    command: string;
    scope: string;
    toolErrorSignals: ReflectionErrorSignalLike[];
    runAt: number;
    usedFallback: boolean;
    eventId?: string;
    sourceReflectionPath?: string;
    writeLegacyCombined?: boolean;
}
export declare function buildReflectionStorePayloads(params: BuildReflectionStorePayloadsParams): {
    eventId: string;
    slices: ReflectionSlices;
    payloads: ReflectionStorePayload[];
};
interface ReflectionStoreDeps {
    embedPassage: (text: string) => Promise<number[]>;
    vectorSearch: (vector: number[], limit?: number, minScore?: number, scopeFilter?: string[]) => Promise<MemorySearchResult[]>;
    store: (entry: Omit<MemoryEntry, "id" | "timestamp">) => Promise<MemoryEntry>;
}
interface StoreReflectionToLanceDBParams extends BuildReflectionStorePayloadsParams, ReflectionStoreDeps {
    dedupeThreshold?: number;
}
export declare function storeReflectionToLanceDB(params: StoreReflectionToLanceDBParams): Promise<{
    stored: boolean;
    eventId: string;
    slices: ReflectionSlices;
    storedKinds: ReflectionStoreKind[];
}>;
export interface LoadReflectionSlicesParams {
    entries: MemoryEntry[];
    agentId: string;
    now?: number;
    deriveMaxAgeMs?: number;
    invariantMaxAgeMs?: number;
}
export declare function loadAgentReflectionSlicesFromEntries(params: LoadReflectionSlicesParams): {
    invariants: string[];
    derived: string[];
};
export declare function computeDerivedLineQuality(nonPlaceholderLineCount: number): number;
export interface LoadReflectionMappedRowsParams {
    entries: MemoryEntry[];
    agentId: string;
    now?: number;
    maxAgeMs?: number;
    maxPerKind?: number;
}
export interface ReflectionMappedSlices {
    userModel: string[];
    agentModel: string[];
    lesson: string[];
    decision: string[];
}
export declare function loadReflectionMappedRowsFromEntries(params: LoadReflectionMappedRowsParams): ReflectionMappedSlices;
export declare function getReflectionDerivedDecayDefaults(): {
    midpointDays: number;
    k: number;
};
export declare function getReflectionInvariantDecayDefaults(): {
    midpointDays: number;
    k: number;
};
export {};
//# sourceMappingURL=reflection-store.d.ts.map