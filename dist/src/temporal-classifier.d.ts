/**
 * Temporal Classifier
 * Classifies memory text as static (permanent fact) or dynamic (time-sensitive).
 * Infers expiry timestamps from temporal expressions.
 */
export type TemporalType = "static" | "dynamic";
/**
 * Classify memory text as static (permanent fact) or dynamic (time-sensitive).
 * Rule-based: keywords → classification. Default: "static" (safer default).
 */
export declare function classifyTemporal(text: string): TemporalType;
/**
 * Infer expiry timestamp from temporal expressions in text.
 * Returns undefined if no temporal expression found.
 * @param text - memory text
 * @param now - current timestamp (default: Date.now())
 */
export declare function inferExpiry(text: string, now?: number): number | undefined;
//# sourceMappingURL=temporal-classifier.d.ts.map