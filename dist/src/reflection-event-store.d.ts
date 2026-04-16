export declare const REFLECTION_SCHEMA_VERSION = 4;
export type ReflectionErrorSignalLike = {
    signatureHash: string;
};
export interface ReflectionEventMetadata {
    type: "memory-reflection-event";
    reflectionVersion: 4;
    stage: "reflect-store";
    eventId: string;
    sessionKey: string;
    sessionId: string;
    agentId: string;
    command: string;
    storedAt: number;
    usedFallback: boolean;
    errorSignals: string[];
    sourceReflectionPath?: string;
}
export interface ReflectionEventPayload {
    kind: "event";
    text: string;
    metadata: ReflectionEventMetadata;
}
export interface BuildReflectionEventPayloadParams {
    eventId?: string;
    scope: string;
    sessionKey: string;
    sessionId: string;
    agentId: string;
    command: string;
    toolErrorSignals: ReflectionErrorSignalLike[];
    runAt: number;
    usedFallback: boolean;
    sourceReflectionPath?: string;
}
export declare function createReflectionEventId(params: {
    runAt: number;
    sessionKey: string;
    sessionId: string;
    agentId: string;
    command: string;
}): string;
export declare function buildReflectionEventPayload(params: BuildReflectionEventPayloadParams): ReflectionEventPayload;
//# sourceMappingURL=reflection-event-store.d.ts.map