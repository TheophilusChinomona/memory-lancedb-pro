type RetryClassifierInput = {
    inReflectionScope: boolean;
    retryCount: number;
    usefulOutputChars: number;
    error: unknown;
};
type RetryClassifierResult = {
    retryable: boolean;
    reason: "not_reflection_scope" | "retry_already_used" | "useful_output_present" | "non_retry_error" | "non_transient_error" | "transient_upstream_failure";
    normalizedError: string;
};
type RetryState = {
    count: number;
};
type RetryRunnerParams<T> = {
    scope: "reflection" | "distiller";
    runner: "embedded" | "cli";
    retryState: RetryState;
    execute: () => Promise<T>;
    onLog?: (level: "info" | "warn", message: string) => void;
    random?: () => number;
    sleep?: (ms: number) => Promise<void>;
};
export declare function isTransientReflectionUpstreamError(error: unknown): boolean;
export declare function isReflectionNonRetryError(error: unknown): boolean;
export declare function classifyReflectionRetry(input: RetryClassifierInput): RetryClassifierResult;
export declare function computeReflectionRetryDelayMs(random?: () => number): number;
export declare function runWithReflectionTransientRetryOnce<T>(params: RetryRunnerParams<T>): Promise<T>;
export {};
//# sourceMappingURL=reflection-retry.d.ts.map