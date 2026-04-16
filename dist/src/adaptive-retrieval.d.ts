/**
 * Adaptive Retrieval
 * Determines whether a query needs memory retrieval at all.
 * Skips retrieval for greetings, commands, simple instructions, and system messages.
 * Saves embedding API calls and reduces noise injection.
 */
/**
 * Determine if a query should skip memory retrieval.
 * Returns true if retrieval should be skipped.
 * @param query The raw prompt text
 * @param minLength Optional minimum length override (if set, overrides built-in thresholds)
 */
export declare function shouldSkipRetrieval(query: string, minLength?: number): boolean;
//# sourceMappingURL=adaptive-retrieval.d.ts.map