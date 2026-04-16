export interface ReflectionSlices {
    invariants: string[];
    derived: string[];
}
export interface ReflectionMappedMemory {
    text: string;
    category: "preference" | "fact" | "decision";
    heading: string;
}
export type ReflectionMappedKind = "user-model" | "agent-model" | "lesson" | "decision";
export interface ReflectionMappedMemoryItem extends ReflectionMappedMemory {
    mappedKind: ReflectionMappedKind;
    ordinal: number;
    groupSize: number;
}
export interface ReflectionSliceItem {
    text: string;
    itemKind: "invariant" | "derived";
    section: "Invariants" | "Derived";
    ordinal: number;
    groupSize: number;
}
export interface ReflectionGovernanceEntry {
    priority?: string;
    status?: string;
    area?: string;
    summary: string;
    details?: string;
    suggestedAction?: string;
}
export declare function extractSectionMarkdown(markdown: string, heading: string): string;
export declare function parseSectionBullets(markdown: string, heading: string): string[];
export declare function isPlaceholderReflectionSliceLine(line: string): boolean;
export declare function normalizeReflectionSliceLine(line: string): string;
export declare function sanitizeReflectionSliceLines(lines: string[]): string[];
export declare function isUnsafeInjectableReflectionLine(line: string): boolean;
export declare function sanitizeInjectableReflectionLines(lines: string[]): string[];
export declare function extractReflectionLessons(reflectionText: string): string[];
export declare function extractReflectionLearningGovernanceCandidates(reflectionText: string): ReflectionGovernanceEntry[];
export declare function extractReflectionMappedMemories(reflectionText: string): ReflectionMappedMemory[];
export declare function extractReflectionMappedMemoryItems(reflectionText: string): ReflectionMappedMemoryItem[];
export declare function extractInjectableReflectionMappedMemoryItems(reflectionText: string): ReflectionMappedMemoryItem[];
export declare function extractInjectableReflectionMappedMemories(reflectionText: string): ReflectionMappedMemory[];
export declare function extractReflectionSlices(reflectionText: string): ReflectionSlices;
export declare function extractInjectableReflectionSlices(reflectionText: string): ReflectionSlices;
export declare function extractReflectionSliceItems(reflectionText: string): ReflectionSliceItem[];
export declare function extractInjectableReflectionSliceItems(reflectionText: string): ReflectionSliceItem[];
//# sourceMappingURL=reflection-slices.d.ts.map