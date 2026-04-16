/**
 * Session Compressor
 *
 * Scores and compresses conversation texts before memory extraction.
 * Prioritizes high-signal content (tool calls, corrections, decisions) over
 * low-signal content (greetings, acknowledgments) so that the fixed extraction
 * budget captures the most important parts of a conversation.
 */
export interface ScoredText {
    /** Original index in the texts array */
    index: number;
    /** The text content */
    text: string;
    /** Score from 0.0 (noise) to 1.0 (high value) */
    score: number;
    /** Human-readable reason for the score */
    reason: string;
}
export interface CompressResult {
    /** Selected texts in chronological order */
    texts: string[];
    /** Detailed scoring for all input texts */
    scored: ScoredText[];
    /** Number of texts dropped */
    dropped: number;
    /** Total chars in output */
    totalChars: number;
}
/**
 * Score a single text segment by its information density.
 */
export declare function scoreText(text: string, index: number): ScoredText;
/**
 * Compress an array of text segments to fit within a character budget.
 *
 * Strategy:
 * 1. Score all texts
 * 2. Always include first and last text (session boundaries)
 * 3. Sort remaining by score descending
 * 4. Greedily select until budget exhausted
 * 5. Handle paired texts (tool call + result: indices i, i+1)
 * 6. Re-sort selected by original index
 * 7. If all texts score < threshold, keep at least minTexts
 */
export declare function compressTexts(texts: string[], maxChars: number, options?: {
    minTexts?: number;
    minScoreToKeep?: number;
}): CompressResult;
/**
 * Estimate the overall value of a conversation for memory extraction.
 * Returns a number between 0.0 and 1.0.
 *
 * Used by the adaptive extraction throttle to skip low-value conversations.
 */
export declare function estimateConversationValue(texts: string[]): number;
//# sourceMappingURL=session-compressor.d.ts.map