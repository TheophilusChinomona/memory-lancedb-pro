export declare function parseReflectionMetadata(metadataRaw: string | undefined): Record<string, unknown>;
export declare function isReflectionEntry(entry: {
    category: string;
    metadata?: string;
}): boolean;
export declare function getDisplayCategoryTag(entry: {
    category: string;
    scope: string;
    metadata?: string;
}): string;
//# sourceMappingURL=reflection-metadata.d.ts.map