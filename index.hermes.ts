/**
 * hermes-memory-lancedb
 * 
 * Hermes-adapted LanceDB memory engine.
 * Ported from memory-lancedb-pro (OpenClaw) with session recovery for Hermes.
 * 
 * Usage:
 *   import { createHermesMemoryEngine } from "hermes-memory-lancedb";
 *   
 *   const engine = createHermesMemoryEngine({
 *     embedding: {
 *       provider: "openai-compatible",
 *       apiKey: "sk-...",
 *       model: "text-embedding-3-small",
 *       baseURL: "https://api.openai.com/v1",
 *       dimensions: 1536,
 *     },
 *     llm: {
 *       apiKey: "sk-...",
 *       model: "gpt-4o-mini",
 *     },
 *     autoCapture: true,
 *     autoRecall: true,
 *     smartExtraction: true,
 *   });
 *   
 *   await engine.initialize();
 *   
 *   // Session recovery (the key fix)
 *   const session = engine.resolveSession({
 *     sessionId: "current-session-id",
 *     platform: "discord",
 *     channelId: "1493777369616355329",
 *   });
 *   
 *   // Auto-recall before prompt
 *   const memories = await engine.autoRecall("what were we working on?");
 *   
 *   // Auto-capture after session
 *   await engine.autoCapture(messages);
 */

// Main engine
export {
  HermesMemoryEngine,
  createHermesMemoryEngine,
  type HermesMemoryConfig,
  type HermesSessionContext,
  type HermesLogger,
} from "./adapters/hermes-plugin.js";

// Session recovery (standalone)
export {
  buildSessionKey,
  loadRegistry,
  saveRegistry,
  lookupSession,
  registerSession,
  touchSession,
  markDormant,
  discoverSessionFiles,
  findSessionsForChannel,
  resolveSessionSearchDirs,
  type SessionRecoveryConfig,
  type SessionRegistryEntry,
  type SessionRegistry,
  type ResolvedSession,
} from "./adapters/session-recovery.js";

// Re-export core modules for direct use
export { MemoryStore, type MemoryEntry, type MemorySearchResult } from "./src/store.js";
export { createEmbedder, getVectorDimensions } from "./src/embedder.js";
export { createRetriever, DEFAULT_RETRIEVAL_CONFIG } from "./src/retriever.js";
export { createScopeManager } from "./src/scopes.js";
export { isNoise } from "./src/noise-filter.js";
export { SmartExtractor } from "./src/smart-extractor.js";
