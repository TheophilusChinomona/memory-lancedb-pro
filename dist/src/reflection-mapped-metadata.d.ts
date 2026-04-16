import type { ReflectionMappedMemoryItem } from "./reflection-slices.js";
export type ReflectionMappedKind = "user-model" | "agent-model" | "lesson" | "decision";
export type ReflectionMappedCategory = "preference" | "fact" | "decision";
export interface ReflectionMappedMetadata {
    type: "memory-reflection-mapped";
    reflectionVersion: 4;
    stage: "reflect-store";
    eventId: string;
    mappedKind: ReflectionMappedKind;
    mappedCategory: ReflectionMappedCategory;
    section: string;
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
export interface ReflectionMappedDecayDefaults {
    midpointDays: number;
    k: number;
    baseWeight: number;
    quality: number;
}
export declare function getReflectionMappedDecayDefaults(kind: ReflectionMappedKind): ReflectionMappedDecayDefaults;
export declare function buildReflectionMappedMetadata(params: {
    mappedItem: ReflectionMappedMemoryItem;
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
}): ReflectionMappedMetadata;
//# sourceMappingURL=reflection-mapped-metadata.d.ts.map