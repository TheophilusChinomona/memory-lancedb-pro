/**
 * Embedding-based Noise Prototype Bank
 *
 * Language-agnostic noise detection: maintains a bank of noise prototype
 * embeddings (recall queries, agent denials, greetings). Input texts are
 * compared via cosine similarity — no regex maintenance required.
 *
 * The bank starts with ~15 built-in multilingual prototypes and grows
 * automatically when the LLM extraction returns zero memories (feedback loop).
 */
import type { Embedder } from "./embedder.js";
export declare class NoisePrototypeBank {
    private vectors;
    private builtinCount;
    private _initialized;
    private debugLog;
    constructor(debugLog?: (msg: string) => void);
    /** Whether the bank has been initialized with prototype embeddings. */
    get initialized(): boolean;
    /** Total number of prototypes (built-in + learned). */
    get size(): number;
    /**
     * Embed all built-in noise prototypes and cache their vectors.
     * Call once at plugin startup. Safe to call multiple times (no-op after first).
     */
    init(embedder: Embedder): Promise<void>;
    /**
     * Check if a text vector matches any noise prototype.
     * Returns true if cosine similarity >= threshold with any prototype.
     */
    isNoise(textVector: number[], threshold?: number): boolean;
    /**
     * LLM feedback: add a text vector to the learned noise bank.
     * Called when LLM extraction returns zero memories (strong noise signal).
     * Deduplicates against existing prototypes (>= 0.95 similarity = skip).
     * Evicts oldest learned prototype when bank exceeds MAX_LEARNED_PROTOTYPES.
     */
    learn(textVector: number[]): void;
}
//# sourceMappingURL=noise-prototypes.d.ts.map