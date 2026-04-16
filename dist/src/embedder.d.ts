/**
 * Embedding Abstraction Layer
 * OpenAI-compatible API for various embedding providers.
 * Supports automatic chunking for documents exceeding embedding context limits.
 *
 * Note: Some providers (e.g. Jina) support extra parameters like `task` and
 * `normalized` on the embeddings endpoint. The OpenAI SDK types do not include
 * these fields, so we pass them via a narrow `any` cast.
 */
export interface EmbeddingConfig {
    provider: "openai-compatible" | "azure-openai";
    apiVersion?: string;
    /** Single API key or array of keys for round-robin rotation with failover. */
    apiKey: string | string[];
    model: string;
    baseURL?: string;
    dimensions?: number;
    /** Optional task type for query embeddings (e.g. "retrieval.query") */
    taskQuery?: string;
    /** Optional task type for passage/document embeddings (e.g. "retrieval.passage") */
    taskPassage?: string;
    /** Optional flag to request normalized embeddings (provider-dependent, e.g. Jina v5) */
    normalized?: boolean;
    /** When true, omit the dimensions parameter from embedding requests even if dimensions is set.
     *  Use this for local models that reject the dimensions parameter with "matryoshka representation" errors. */
    omitDimensions?: boolean;
    /** Enable automatic chunking for documents exceeding context limits (default: true) */
    chunking?: boolean;
}
export declare function formatEmbeddingProviderError(error: unknown, opts: {
    baseURL?: string;
    model: string;
    mode?: "single" | "batch";
}): string;
export declare function getVectorDimensions(model: string, overrideDims?: number): number;
export declare class Embedder {
    /** Pool of OpenAI clients — one per API key for round-robin rotation. */
    private clients;
    /** Round-robin index for client rotation. */
    private _clientIndex;
    readonly dimensions: number;
    private readonly _cache;
    private readonly _model;
    private readonly _baseURL?;
    private readonly _taskQuery?;
    private readonly _taskPassage?;
    private readonly _normalized?;
    private readonly _capabilities;
    /** Optional requested dimensions to pass through to the embedding provider (OpenAI-compatible). */
    private readonly _requestDimensions?;
    /** When true, omit the dimensions parameter even if _requestDimensions is set. */
    private readonly _omitDimensions;
    /** Enable automatic chunking for long documents (default: true) */
    private readonly _autoChunk;
    constructor(config: EmbeddingConfig & {
        chunking?: boolean;
    });
    /** Return the next client in round-robin order. */
    private nextClient;
    /** Check whether an error is a rate-limit / quota-exceeded / overload error. */
    private isRateLimitError;
    /**
     * Detect if the configured baseURL points to a local Ollama instance.
     * Ollama's HTTP server does not properly handle AbortController signals through
     * the OpenAI SDK's HTTP client, causing long-lived sockets that don't close
     * when the embedding pipeline times out. For Ollama we use native fetch instead.
     */
    private isOllamaProvider;
    /**
     * Call embeddings.create using native fetch (bypasses OpenAI SDK).
     * Used exclusively for Ollama endpoints where AbortController must work
     * correctly to avoid long-lived stalled sockets.
     */
    private embedWithNativeFetch;
    /**
     * Call embeddings.create with automatic key rotation on rate-limit errors.
     * Tries each key in the pool at most once before giving up.
     * Accepts an optional AbortSignal to support true request cancellation.
     *
     * For Ollama endpoints, native fetch is used instead of the OpenAI SDK
     * because AbortController does not reliably abort Ollama's HTTP connections
     * through the SDK's HTTP client on Node.js.
     */
    private embedWithRetry;
    /** Number of API keys in the rotation pool. */
    get keyCount(): number;
    /** Wrap a single embedding operation with a global timeout via AbortSignal. */
    private withTimeout;
    /**
     * Backward-compatible embedding API.
     *
     * Historically the plugin used a single `embed()` method for both query and
     * passage embeddings. With task-aware providers we treat this as passage.
     */
    embed(text: string): Promise<number[]>;
    /** Backward-compatible batch embedding API (treated as passage). */
    embedBatch(texts: string[]): Promise<number[][]>;
    embedQuery(text: string, signal?: AbortSignal): Promise<number[]>;
    embedPassage(text: string, signal?: AbortSignal): Promise<number[]>;
    embedBatchQuery(texts: string[], signal?: AbortSignal): Promise<number[][]>;
    embedBatchPassage(texts: string[], signal?: AbortSignal): Promise<number[][]>;
    private validateEmbedding;
    private buildPayload;
    private embedSingle;
    private embedMany;
    get model(): string;
    test(): Promise<{
        success: boolean;
        error?: string;
        dimensions?: number;
    }>;
    get cacheStats(): {
        keyCount: number;
        size: number;
        hits: number;
        misses: number;
        hitRate: string;
    };
}
export declare function createEmbedder(config: EmbeddingConfig): Embedder;
//# sourceMappingURL=embedder.d.ts.map