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
import { join, dirname } from "node:path";
import { existsSync, readdirSync, statSync } from "node:fs";
// ============================================================================
// Default Paths
// ============================================================================
function getDefaultHermesHome() {
    const home = process.env.HOME || process.env.USERPROFILE || "/root";
    return join(home, ".hermes");
}
function getDefaultSessionsDir(hermesHome) {
    return join(hermesHome, "sessions");
}
function getDefaultRegistryPath(hermesHome) {
    return join(hermesHome, "session-registry.json");
}
// ============================================================================
// Session Key Construction (mirrors OpenClaw's sessionKey format)
// ============================================================================
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
export function buildSessionKey(platform, channelId, threadId) {
    const parts = [platform, channelId];
    if (threadId) {
        parts.push("thread", threadId);
    }
    return parts.join(":");
}
// ============================================================================
// Registry Operations
// ============================================================================
/**
 * Load the session registry from disk.
 * Returns empty object if file doesn't exist yet.
 */
export function loadRegistry(config) {
    const registryPath = config.sessionRegistryPath
        || getDefaultRegistryPath(config.hermesHome);
    if (!existsSync(registryPath)) {
        return {};
    }
    try {
        const raw = require("node:fs").readFileSync(registryPath, "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
}
/**
 * Save the session registry to disk.
 */
export function saveRegistry(registry, config) {
    const registryPath = config.sessionRegistryPath
        || getDefaultRegistryPath(config.hermesHome);
    const fs = require("node:fs");
    fs.mkdirSync(dirname(registryPath), { recursive: true });
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}
/**
 * Look up a session by its key (platform + channel + thread).
 * Returns null if no matching session found.
 */
export function lookupSession(sessionKey, config) {
    const registry = loadRegistry(config);
    return registry[sessionKey] || null;
}
/**
 * Register a new session in the registry.
 */
export function registerSession(sessionKey, entry, config) {
    const registry = loadRegistry(config);
    registry[sessionKey] = entry;
    saveRegistry(registry, config);
}
/**
 * Update the last_active timestamp for a session.
 */
export function touchSession(sessionKey, config) {
    const registry = loadRegistry(config);
    if (registry[sessionKey]) {
        registry[sessionKey].last_active = new Date().toISOString();
        registry[sessionKey].status = "active";
        saveRegistry(registry, config);
    }
}
/**
 * Mark a session as dormant (not expired — still resumable).
 */
export function markDormant(sessionKey, config) {
    const registry = loadRegistry(config);
    if (registry[sessionKey]) {
        registry[sessionKey].status = "dormant";
        saveRegistry(registry, config);
    }
}
// ============================================================================
// Session File Discovery
// ============================================================================
/**
 * Find all session files in the Hermes sessions directory.
 */
export function discoverSessionFiles(config) {
    const sessionsDir = getDefaultSessionsDir(config.hermesHome);
    if (!existsSync(sessionsDir)) {
        return [];
    }
    const results = [];
    const files = readdirSync(sessionsDir);
    for (const file of files) {
        if (!file.endsWith(".json") && !file.endsWith(".jsonl"))
            continue;
        if (file === "session-registry.json")
            continue;
        const filePath = join(sessionsDir, file);
        try {
            const stats = statSync(filePath);
            if (!stats.isFile())
                continue;
            // Extract session ID from filename
            // Hermes format: session_<timestamp>_<hash>.json
            // Registry format: <sessionKey>.json
            const sessionId = file.replace(/\.(json|jsonl)$/, "");
            results.push({
                sessionId,
                filePath,
                lastModified: stats.mtime,
                sizeBytes: stats.size,
            });
        }
        catch {
            // Skip files we can't stat
        }
    }
    // Sort by most recent first
    results.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    return results;
}
/**
 * Find session files relevant to a specific platform/channel.
 * Checks registry first, then falls back to scanning session metadata.
 */
export function findSessionsForChannel(platform, channelId, threadId, config) {
    // First check registry
    const sessionKey = buildSessionKey(platform, channelId, threadId);
    const registryEntry = lookupSession(sessionKey, config);
    if (registryEntry) {
        const sessionsDir = getDefaultSessionsDir(config.hermesHome);
        const filePath = join(sessionsDir, `${registryEntry.session_id}.json`);
        if (existsSync(filePath)) {
            const stats = statSync(filePath);
            return [{
                    sessionId: registryEntry.session_id,
                    filePath,
                    lastModified: stats.mtime,
                    sizeBytes: stats.size,
                    platform: registryEntry.platform,
                    channelId: registryEntry.channel_id,
                }];
        }
    }
    // Fall back to scanning all sessions for platform/channel metadata
    const allSessions = discoverSessionFiles(config);
    return allSessions.filter(s => {
        // TODO: Read session metadata to match platform/channel
        // For now, return empty — registry is the primary lookup
        return false;
    });
}
// ============================================================================
// Session Search Dirs (for memory retrieval)
// ============================================================================
/**
 * Resolve directories to search for session transcripts.
 * This is the equivalent of OpenClaw's resolveReflectionSessionSearchDirs
 * but adapted for Hermes's flat session directory layout.
 */
export function resolveSessionSearchDirs(config) {
    const dirs = [];
    const seen = new Set();
    const addDir = (dir) => {
        if (!seen.has(dir) && existsSync(dir)) {
            seen.add(dir);
            dirs.push(dir);
        }
    };
    // Primary: Hermes sessions directory
    addDir(getDefaultSessionsDir(config.hermesHome));
    // Check for legacy OpenClaw sessions (migration path)
    const home = process.env.HOME || process.env.USERPROFILE || "/root";
    const openclawHome = join(home, ".openclaw");
    if (existsSync(openclawHome)) {
        // Check for pre-migration directory
        const preMigration = join(home, ".openclaw.pre-migration");
        if (existsSync(preMigration)) {
            addDir(join(preMigration, "agents", "main", "sessions"));
        }
        addDir(join(openclawHome, "agents", "main", "sessions"));
    }
    return dirs;
}
//# sourceMappingURL=session-recovery.js.map