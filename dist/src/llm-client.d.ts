/**
 * LLM Client for memory extraction and dedup decisions.
 * Uses OpenAI-compatible API (reuses the embedding provider config).
 */
export interface LlmClientConfig {
    apiKey?: string;
    model: string;
    baseURL?: string;
    auth?: "api-key" | "oauth";
    oauthPath?: string;
    oauthProvider?: string;
    timeoutMs?: number;
    log?: (msg: string) => void;
    /** Warn-level logger for user-visible failures (timeouts, retries, network errors). */
    warnLog?: (msg: string) => void;
}
export interface LlmClient {
    /** Send a prompt and parse the JSON response. Returns null on failure. */
    completeJson<T>(prompt: string, label?: string): Promise<T | null>;
    /** Best-effort diagnostics for the most recent failure, if any. */
    getLastError(): string | null;
}
/**
 * Extract JSON from an LLM response that may be wrapped in markdown fences
 * or contain surrounding text.
 */
declare function extractJsonFromResponse(text: string): string | null;
/**
 * Best-effort repair for common LLM JSON issues:
 * - unescaped quotes inside string values
 * - raw newlines / tabs inside strings
 * - trailing commas before } or ]
 */
declare function repairCommonJson(text: string): string;
export declare function createLlmClient(config: LlmClientConfig): LlmClient;
export { extractJsonFromResponse, repairCommonJson };
//# sourceMappingURL=llm-client.d.ts.map