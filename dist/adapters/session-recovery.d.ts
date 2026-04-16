/**
 * Hermes Session Recovery
 *
 * Adapts OpenClaw's session-recovery.ts for Hermes's directory layout.
 *
 * OpenClaw layout:
 *   ~/.openclaw/agents/<agentId>/sessions/*.jsonl
 *   ~/.openclaw/workspace-<name>/sessions/
 *
 * Hermes layout:
 *   ~/.hermes/sessions/session_<timestamp>_<hash>.json
 *   ~/.hermes/sessions/<thread_key>.json  (after registry implementation)
 *
 * This module resolves session files across both layouts and provides
 * a unified interface for memory retrieval to find relevant past sessions.
 */
export interface SessionRecoveryConfig {
    hermesHome: string;
    sessionRegistryPath?: string;
    maxSearchDepth?: number;
}
export interface ResolvedSession {
    sessionId: string;
    filePath: string;
    lastModified: Date;
    sizeBytes: number;
    platform?: string;
    channelId?: string;
}
export interface SessionRegistryEntry {
    session_id: string;
    created: string;
    last_active: string;
    platform: string;
    channel_id: string;
    thread_id?: string;
    status: "active" | "dormant" | "expired";
}
export interface SessionRegistry {
    [sessionKey: string]: SessionRegistryEntry;
}
/**
 * Build a deterministic session key from platform identifiers.
 *
 * Format: [platform]:[channelId][:thread:<threadId>]
 *
 * Examples:
 *   discord:1493777369616355329
 *   whatsapp:+27712345678
 *   discord:123456:thread:789012
 */
export declare function buildSessionKey(platform: string, channelId: string, threadId?: string): string;
/**
 * Load the session registry from disk.
 * Returns empty object if file doesn't exist yet.
 */
export declare function loadRegistry(config: SessionRecoveryConfig): SessionRegistry;
/**
 * Save the session registry to disk.
 */
export declare function saveRegistry(registry: SessionRegistry, config: SessionRecoveryConfig): void;
/**
 * Look up a session by its key (platform + channel + thread).
 * Returns null if no matching session found.
 */
export declare function lookupSession(sessionKey: string, config: SessionRecoveryConfig): SessionRegistryEntry | null;
/**
 * Register a new session in the registry.
 */
export declare function registerSession(sessionKey: string, entry: SessionRegistryEntry, config: SessionRecoveryConfig): void;
/**
 * Update the last_active timestamp for a session.
 */
export declare function touchSession(sessionKey: string, config: SessionRecoveryConfig): void;
/**
 * Mark a session as dormant (not expired — still resumable).
 */
export declare function markDormant(sessionKey: string, config: SessionRecoveryConfig): void;
/**
 * Find all session files in the Hermes sessions directory.
 */
export declare function discoverSessionFiles(config: SessionRecoveryConfig): ResolvedSession[];
/**
 * Find session files relevant to a specific platform/channel.
 * Checks registry first, then falls back to scanning session metadata.
 */
export declare function findSessionsForChannel(platform: string, channelId: string, threadId: string | undefined, config: SessionRecoveryConfig): ResolvedSession[];
/**
 * Resolve directories to search for session transcripts.
 * This is the equivalent of OpenClaw's resolveReflectionSessionSearchDirs
 * but adapted for Hermes's flat session directory layout.
 */
export declare function resolveSessionSearchDirs(config: SessionRecoveryConfig): string[];
//# sourceMappingURL=session-recovery.d.ts.map