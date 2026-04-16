/**
 * Hermes Session Recovery
 *
 * Deterministic session registry that maps platform-specific thread IDs
 * to persistent session files. Solves the "session expiry" problem where
 * Hermes creates a new session for every message on a thread.
 *
 * Hermes layout:
 *   ~/.hermes/sessions/session_<timestamp>_<hash>.json
 *   ~/.hermes/session-registry.json  ← deterministic ID mapping
 *
 * Key format: [platform]:[channelId][:thread:<threadId>]
 *   discord:1493777369616355329
 *   whatsapp:+27123456789
 *   discord:123456:thread:789012
 */

import { join, dirname } from "node:path";
import { existsSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";

// ============================================================================
// Types
// ============================================================================

export interface SessionRecoveryConfig {
  hermesHome: string;
  sessionRegistryPath?: string;
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

export interface ResolvedSession {
  sessionId: string;
  filePath: string;
  lastModified: Date;
  sizeBytes: number;
  platform?: string;
  channelId?: string;
}

// ============================================================================
// Default Paths
// ============================================================================

function getDefaultHermesHome(): string {
  return process.env.HERMES_HOME
    || join(process.env.HOME || "/root", ".hermes");
}

function getDefaultSessionsDir(hermesHome: string): string {
  return join(hermesHome, "sessions");
}

function getDefaultRegistryPath(hermesHome: string): string {
  return join(hermesHome, "session-registry.json");
}

// ============================================================================
// Session Key Construction
// ============================================================================

/**
 * Build a deterministic session key from platform identifiers.
 *
 * Format: [platform]:[channelId][:thread:<threadId>]
 *
 * Examples:
 *   discord:1493777369616355329
 *   whatsapp:+277****5678
 *   discord:123456:thread:789012
 */
export function buildSessionKey(
  platform: string,
  channelId: string,
  threadId?: string,
): string {
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
export function loadRegistry(config: SessionRecoveryConfig): SessionRegistry {
  const registryPath = config.sessionRegistryPath
    || getDefaultRegistryPath(config.hermesHome);

  if (!existsSync(registryPath)) {
    return {};
  }

  try {
    const raw = readFileSync(registryPath, "utf-8");
    return JSON.parse(raw) as SessionRegistry;
  } catch {
    return {};
  }
}

/**
 * Save the session registry to disk (atomic write via same-dir temp file).
 */
export function saveRegistry(
  registry: SessionRegistry,
  config: SessionRecoveryConfig,
): void {
  const registryPath = config.sessionRegistryPath
    || getDefaultRegistryPath(config.hermesHome);

  const dir = dirname(registryPath);
  mkdirSync(dir, { recursive: true });

  const tmpPath = `${registryPath}.tmp`;
  writeFileSync(tmpPath, JSON.stringify(registry, null, 2));
  writeFileSync(registryPath, readFileSync(tmpPath));
  // Best-effort cleanup of temp file
  try { unlinkSync(tmpPath); } catch {}
}

/**
 * Look up a session by its key (platform + channel + thread).
 * Returns null if no matching session found.
 */
export function lookupSession(
  sessionKey: string,
  config: SessionRecoveryConfig,
): SessionRegistryEntry | null {
  const registry = loadRegistry(config);
  return registry[sessionKey] || null;
}

/**
 * Register a new session in the registry.
 */
export function registerSession(
  sessionKey: string,
  entry: SessionRegistryEntry,
  config: SessionRecoveryConfig,
): void {
  const registry = loadRegistry(config);
  registry[sessionKey] = entry;
  saveRegistry(registry, config);
}

/**
 * Update the last_active timestamp for a session.
 */
export function touchSession(
  sessionKey: string,
  config: SessionRecoveryConfig,
): void {
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
export function markDormant(
  sessionKey: string,
  config: SessionRecoveryConfig,
): void {
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
export function discoverSessionFiles(
  config: SessionRecoveryConfig,
): ResolvedSession[] {
  const sessionsDir = getDefaultSessionsDir(config.hermesHome);

  if (!existsSync(sessionsDir)) {
    return [];
  }

  const results: ResolvedSession[] = [];
  const files = readdirSync(sessionsDir);

  for (const file of files) {
    if (!file.endsWith(".json") && !file.endsWith(".jsonl")) continue;
    if (file === "session-registry.json") continue;

    const filePath = join(sessionsDir, file);
    try {
      const fileStats = statSync(filePath);
      if (!fileStats.isFile()) continue;

      const sessionId = file.replace(/\.(json|jsonl)$/, "");

      results.push({
        sessionId,
        filePath,
        lastModified: fileStats.mtime,
        sizeBytes: fileStats.size,
      });
    } catch {
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
export function findSessionsForChannel(
  platform: string,
  channelId: string,
  threadId: string | undefined,
  config: SessionRecoveryConfig,
): ResolvedSession[] {
  // First check registry
  const sessionKey = buildSessionKey(platform, channelId, threadId);
  const registryEntry = lookupSession(sessionKey, config);

  if (registryEntry) {
    const sessionsDir = getDefaultSessionsDir(config.hermesHome);
    const filePath = join(sessionsDir, `${registryEntry.session_id}.json`);

    if (existsSync(filePath)) {
      const fileStats = statSync(filePath);
      return [{
        sessionId: registryEntry.session_id,
        filePath,
        lastModified: fileStats.mtime,
        sizeBytes: fileStats.size,
        platform: registryEntry.platform,
        channelId: registryEntry.channel_id,
      }];
    }
  }

  return [];
}

/**
 * Resolve directories to search for session transcripts.
 * Primary: ~/.hermes/sessions/
 * Fallback: OpenClaw legacy paths (for migration).
 */
export function resolveSessionSearchDirs(config: SessionRecoveryConfig): string[] {
  const dirs: string[] = [];
  const seen = new Set<string>();

  const addDir = (dir: string) => {
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
    const preMigration = join(home, ".openclaw.pre-migration");
    if (existsSync(preMigration)) {
      addDir(join(preMigration, "agents", "main", "sessions"));
    }
    addDir(join(openclawHome, "agents", "main", "sessions"));
  }

  return dirs;
}
