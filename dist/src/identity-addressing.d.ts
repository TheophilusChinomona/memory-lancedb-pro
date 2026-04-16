import type { CandidateMemory } from "./memory-categories.js";
export declare const CANONICAL_NAME_FACT_KEY = "entities:\u59D3\u540D";
export declare const CANONICAL_ADDRESSING_FACT_KEY = "preferences:\u79F0\u547C\u504F\u597D";
export type IdentityAddressingSlot = "name" | "addressing";
type IdentityAddressingMemoryLike = {
    factKey?: string;
    text?: string;
    abstract?: string;
    overview?: string;
    content?: string;
};
export declare function createIdentityAndAddressingCandidates(text: string): CandidateMemory[];
export declare function extractIdentityAndAddressingValues(text: string): {
    name?: string;
    addressing?: string;
};
export declare function classifyIdentityAndAddressingMemory(params: IdentityAddressingMemoryLike): {
    slots: Set<IdentityAddressingSlot>;
    name?: string;
    addressing?: string;
};
export declare function canonicalizeIdentityAndAddressingCandidate(candidate: CandidateMemory): CandidateMemory;
export declare function isCanonicalIdentityOrAddressingFactKey(factKey: string | undefined): boolean;
export {};
//# sourceMappingURL=identity-addressing.d.ts.map