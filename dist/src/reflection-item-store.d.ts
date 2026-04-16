import type { ReflectionSliceItem } from "./reflection-slices.js";
export type ReflectionItemKind = "invariant" | "derived";
export interface ReflectionItemMetadata {
    type: "memory-reflection-item";
    reflectionVersion: 4;
    stage: "reflect-store";
    eventId: string;
    itemKind: ReflectionItemKind;
    section: "Invariants" | "Derived";
    ordinal: number;
    groupSize: number;
    agentId: string;
    sessionKey: string;
    sessionId: string;
    storedAt: number;
    usedFallback: boolean;
    errorSignals: string[];
    decayModel: "logistic";
    decayMidpointDays: number;
    decayK: number;
    baseWeight: number;
    quality: number;
    sourceReflectionPath?: string;
}
export interface ReflectionItemPayload {
    kind: "item-invariant" | "item-derived";
    text: string;
    metadata: ReflectionItemMetadata;
}
export interface BuildReflectionItemPayloadsParams {
    items: ReflectionSliceItem[];
    eventId: string;
    agentId: string;
    sessionKey: string;
    sessionId: string;
    runAt: number;
    usedFallback: boolean;
    toolErrorSignals: Array<{
        signatureHash: string;
    }>;
    sourceReflectionPath?: string;
}
export declare const REFLECTION_INVARIANT_DECAY_MIDPOINT_DAYS = 45;
export declare const REFLECTION_INVARIANT_DECAY_K = 0.22;
export declare const REFLECTION_INVARIANT_BASE_WEIGHT = 1.1;
export declare const REFLECTION_INVARIANT_QUALITY = 1;
export declare const REFLECTION_DERIVED_DECAY_MIDPOINT_DAYS = 7;
export declare const REFLECTION_DERIVED_DECAY_K = 0.65;
export declare const REFLECTION_DERIVED_BASE_WEIGHT = 1;
export declare const REFLECTION_DERIVED_QUALITY = 0.95;
export declare function getReflectionItemDecayDefaults(itemKind: ReflectionItemKind): {
    midpointDays: number;
    k: number;
    baseWeight: number;
    quality: number;
};
export declare function buildReflectionItemPayloads(params: BuildReflectionItemPayloadsParams): ReflectionItemPayload[];
//# sourceMappingURL=reflection-item-store.d.ts.map