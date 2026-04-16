/**
 * ClawTeam Shared Memory Scope Integration
 *
 * Provides env-var-driven scope extension for ClawTeam multi-agent setups.
 * When CLAWTEAM_MEMORY_SCOPE is set, agents gain access to the specified
 * team scopes in addition to their own default scopes.
 *
 * Note: this extends `getAccessibleScopes()`, which MemoryScopeManager's
 * `isAccessible()` and `getScopeFilter()` both delegate to. So the extra
 * scopes affect both read and write access checks. The default *write target*
 * (getDefaultScope) is NOT changed — agents still write to their own scope
 * unless they explicitly specify a team scope.
 */
import type { MemoryScopeManager } from "./scopes.js";
/**
 * Parse the CLAWTEAM_MEMORY_SCOPE env var value into a list of scope names.
 * Supports comma-separated values, trims whitespace, and filters empty strings.
 */
export declare function parseClawteamScopes(envValue: string | undefined): string[];
/**
 * Register ClawTeam scopes and extend the scope manager's accessible scopes.
 *
 * 1. Registers scope definitions for any scopes not already defined.
 * 2. Wraps `getAccessibleScopes()` to include the extra scopes for all agents.
 *
 * Designed for MemoryScopeManager specifically, where `isAccessible()` and
 * `getScopeFilter()` delegate to `getAccessibleScopes()`. Custom ScopeManager
 * implementations may need additional patching.
 */
export declare function applyClawteamScopes(scopeManager: MemoryScopeManager, scopes: string[]): void;
//# sourceMappingURL=clawteam-scope.d.ts.map