/**
 * Prompt templates for intelligent memory extraction.
 * Three mandatory prompts:
 * - buildExtractionPrompt: 6-category L0/L1/L2 extraction with few-shot
 * - buildDedupPrompt: CREATE/MERGE/SKIP dedup decision
 * - buildMergePrompt: Memory merge with three-level structure
 */
export declare function buildExtractionPrompt(conversationText: string, user: string): string;
export declare function buildDedupPrompt(candidateAbstract: string, candidateOverview: string, candidateContent: string, existingMemories: string): string;
export declare function buildMergePrompt(existingAbstract: string, existingOverview: string, existingContent: string, newAbstract: string, newOverview: string, newContent: string, category: string): string;
//# sourceMappingURL=extraction-prompts.d.ts.map