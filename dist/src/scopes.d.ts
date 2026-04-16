/**
 * Multi-Scope Access Control System
 * Manages memory isolation and access permissions
 */
export interface ScopeDefinition {
    description: string;
    metadata?: Record<string, unknown>;
}
export interface ScopeConfig {
    default: string;
    definitions: Record<string, ScopeDefinition>;
    agentAccess: Record<string, string[]>;
}
export interface ScopeManager {
    /**
     * Enumerate known scopes for the caller.
     *
     * Note: this is an enumeration API, not a full description of every syntactically-valid built-in
     * pattern accepted by `validateScope()` / `isAccessible()`. In particular, bypass callers may still
     * validate built-in scope patterns that are not explicitly registered in `definitions`.
     */
    getAccessibleScopes(agentId?: string): string[];
    /**
     * Optional store-layer filter hook.
     * Return `undefined` only for intentional full-bypass callers (for example internal system tasks).
     * Custom implementations should keep this distinct from `getAccessibleScopes()`, which is an
     * enumeration API and should remain consistent with `isAccessible()`.
     */
    getScopeFilter?(agentId?: string): string[] | undefined;
    getDefaultScope(agentId?: string): string;
    isAccessible(scope: string, agentId?: string): boolean;
    validateScope(scope: string): boolean;
    getAllScopes(): string[];
    getScopeDefinition(scope: string): ScopeDefinition | undefined;
}
export declare const DEFAULT_SCOPE_CONFIG: ScopeConfig;
export declare function isSystemBypassId(agentId?: string): boolean;
/** @internal Exported for testing only — resets the legacy warning throttle. */
export declare function _resetLegacyFallbackWarningState(): void;
/**
 * Extract agentId from an OpenClaw session key.
 * Supports both formats:
 *   - "agent:main:discord:channel:123" (with trailing segments)
 *   - "agent:main" (two-segment, no trailing colon)
 * Returns undefined for missing keys, non-agent keys, or reserved bypass IDs.
 * This is the single canonical implementation — do not duplicate inline.
 */
export declare function parseAgentIdFromSessionKey(sessionKey: string | undefined): string | undefined;
export declare class MemoryScopeManager implements ScopeManager {
    private config;
    constructor(config?: Partial<ScopeConfig>);
    private validateConfiguration;
    private isBuiltInScope;
    getAccessibleScopes(agentId?: string): string[];
    /**
     * Store-layer scope filter semantics:
     *
     * | Return value        | Store behavior                          | When                                   |
     * |---------------------|-----------------------------------------|----------------------------------------|
     * | `undefined`         | No scope filtering (full bypass)        | Reserved bypass ids (system/undefined) |
     * | `[]`                | Deny all reads / match nothing          | Explicit empty filter                  |
     * | `["global", ...]`   | Restrict reads to listed scopes         | Normal agent with explicit access      |
     *
     * IMPORTANT: Returning `[]` is now an explicit deny-all signal.
     * Custom ScopeManager implementations should return `undefined` for bypass
     * and `[]` only when they intend reads to match nothing.
     */
    getScopeFilter(agentId?: string): string[] | undefined;
    getDefaultScope(agentId?: string): string;
    isAccessible(scope: string, agentId?: string): boolean;
    validateScope(scope: string): boolean;
    getAllScopes(): string[];
    getScopeDefinition(scope: string): ScopeDefinition | undefined;
    addScopeDefinition(scope: string, definition: ScopeDefinition): void;
    removeScopeDefinition(scope: string): boolean;
    setAgentAccess(agentId: string, scopes: string[]): void;
    removeAgentAccess(agentId: string): boolean;
    private validateScopeFormat;
    exportConfig(): ScopeConfig;
    importConfig(config: Partial<ScopeConfig>): void;
    getStats(): {
        totalScopes: number;
        agentsWithCustomAccess: number;
        scopesByType: Record<string, number>;
    };
}
export declare function createScopeManager(config?: Partial<ScopeConfig>): MemoryScopeManager;
export declare function createAgentScope(agentId: string): string;
export declare function createCustomScope(name: string): string;
export declare function createProjectScope(projectId: string): string;
export declare function createUserScope(userId: string): string;
export declare function parseScopeId(scope: string): {
    type: string;
    id: string;
} | null;
export declare function isScopeAccessible(scope: string, allowedScopes: string[]): boolean;
export declare function resolveScopeFilter(scopeManager: Pick<ScopeManager, "getAccessibleScopes"> & {
    getScopeFilter?: (agentId?: string) => string[] | undefined;
}, agentId?: string): string[] | undefined;
export declare function filterScopesForAgent(scopes: string[], agentId?: string, scopeManager?: ScopeManager): string[];
//# sourceMappingURL=scopes.d.ts.map