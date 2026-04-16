/**
 * Noise Filter
 * Filters out low-quality memories (meta-questions, agent denials, session boilerplate)
 * Inspired by openclaw-plugin-continuity's noise filtering approach.
 */
/**
 * Envelope noise patterns — Discord/channel metadata headers and blocks
 * that have zero informational value for memory extraction.
 * Used as a fast pre-filter before embedding-based noise checks.
 */
export declare const ENVELOPE_NOISE_PATTERNS: RegExp[];
export interface NoiseFilterOptions {
    /** Filter agent denial responses (default: true) */
    filterDenials?: boolean;
    /** Filter meta-questions about memory (default: true) */
    filterMetaQuestions?: boolean;
    /** Filter session boilerplate (default: true) */
    filterBoilerplate?: boolean;
}
/**
 * Check if a memory text is noise that should be filtered out.
 * Returns true if the text is noise.
 */
export declare function isNoise(text: string, options?: NoiseFilterOptions): boolean;
/**
 * Filter an array of items, removing noise entries.
 */
export declare function filterNoise<T>(items: T[], getText: (item: T) => string, options?: NoiseFilterOptions): T[];
//# sourceMappingURL=noise-filter.d.ts.map