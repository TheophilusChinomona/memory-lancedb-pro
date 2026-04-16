/**
 * Long Context Chunking System
 *
 * Goal: split documents that exceed embedding model context limits into smaller,
 * semantically coherent chunks with overlap.
 *
 * Notes:
 * - We use *character counts* as a conservative proxy for tokens.
 * - The embedder triggers this only after a provider throws a context-length error.
 */
export interface ChunkMetadata {
    startIndex: number;
    endIndex: number;
    length: number;
}
export interface ChunkResult {
    chunks: string[];
    metadatas: ChunkMetadata[];
    totalOriginalLength: number;
    chunkCount: number;
}
export interface ChunkerConfig {
    /** Maximum characters per chunk. */
    maxChunkSize: number;
    /** Overlap between chunks in characters. */
    overlapSize: number;
    /** Minimum chunk size (except the final chunk). */
    minChunkSize: number;
    /** Attempt to split on sentence boundaries for better semantic coherence. */
    semanticSplit: boolean;
    /** Max lines per chunk before we try to split earlier on a line boundary. */
    maxLinesPerChunk: number;
}
export declare const EMBEDDING_CONTEXT_LIMITS: Record<string, number>;
export declare const DEFAULT_CHUNKER_CONFIG: ChunkerConfig;
export declare function chunkDocument(text: string, config?: ChunkerConfig): ChunkResult;
/**
 * Smart chunker that adapts to model context limits.
 *
 * We intentionally pick conservative char limits (70% of the reported limit)
 * since token/char ratios vary.
 */
export declare function smartChunk(text: string, embedderModel?: string): ChunkResult;
export default chunkDocument;
//# sourceMappingURL=chunker.d.ts.map