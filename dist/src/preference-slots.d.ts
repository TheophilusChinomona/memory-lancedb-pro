export interface ParsedBrandItemPreference {
    brand: string;
    items: string[];
    aggregate: boolean;
}
export interface AtomicBrandItemPreferenceSlot {
    type: "brand-item";
    brand: string;
    item: string;
}
export declare function normalizePreferenceToken(value: string): string;
export declare function parseBrandItemPreference(text: string): ParsedBrandItemPreference | null;
export declare function inferAtomicBrandItemPreferenceSlot(text: string): AtomicBrandItemPreferenceSlot | null;
//# sourceMappingURL=preference-slots.d.ts.map