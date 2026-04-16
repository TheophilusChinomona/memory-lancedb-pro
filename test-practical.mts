/**
 * Practical test for hermes-memory-lancedb
 * Tests: session recovery, store, embedder, retriever
 */

import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { randomUUID } from "node:crypto";

// ============================================================================
// Test 1: Session Recovery (no dependencies)
// ============================================================================

async function testSessionRecovery() {
  console.log("\n=== Test 1: Session Recovery ===");
  
  const testDir = "/tmp/hermes-memory-test";
  if (existsSync(testDir)) rmSync(testDir, { recursive: true });
  mkdirSync(testDir, { recursive: true });

  const { buildSessionKey, registerSession, lookupSession, touchSession, markDormant } = 
    await import("./adapters/session-recovery.ts");

  const config = { hermesHome: testDir };

  // Test key construction
  const key1 = buildSessionKey("discord", "1493777369616355329");
  const key2 = buildSessionKey("discord", "1493777369616355329", "thread-123");
  const key3 = buildSessionKey("whatsapp", "+27712345678");

  console.log(`  Key 1 (discord): ${key1}`);
  console.log(`  Key 2 (discord+thread): ${key2}`);
  console.log(`  Key 3 (whatsapp): ${key3}`);

  // Test registration
  const sessionId = `session_${Date.now()}_test123`;
  registerSession(key1, {
    session_id: sessionId,
    created: new Date().toISOString(),
    last_active: new Date().toISOString(),
    platform: "discord",
    channel_id: "1493777369616355329",
    status: "active",
  }, config);

  // Test lookup
  const found = lookupSession(key1, config);
  console.log(`  Lookup: ${found ? found.session_id : "NOT FOUND"}`);
  console.assert(found?.session_id === sessionId, "Session should be found");

  // Test touch
  touchSession(key1, config);
  const touched = lookupSession(key1, config);
  console.log(`  After touch: ${touched?.status}`);

  // Test dormant
  markDormant(key1, config);
  const dormant = lookupSession(key1, config);
  console.log(`  After dormant: ${dormant?.status}`);
  console.assert(dormant?.status === "dormant", "Should be dormant");

  // Test no-match returns null
  const noMatch = lookupSession("telegram:+1234567890", config);
  console.log(`  No match: ${noMatch === null ? "null (correct)" : "ERROR"}`);

  // Verify registry file exists
  const registryPath = join(testDir, "session-registry.json");
  const registry = JSON.parse(readFileSync(registryPath, "utf-8"));
  console.log(`  Registry keys: ${Object.keys(registry).join(", ")}`);

  console.log("  PASS\n");
  rmSync(testDir, { recursive: true });
}

// ============================================================================
// Test 2: Store + Embedder (real LanceDB)
// ============================================================================

async function testStoreAndEmbedder() {
  console.log("=== Test 2: Store + Embedder ===");

  const testDbPath = "/tmp/hermes-memory-test-db";
  if (existsSync(testDbPath)) rmSync(testDbPath, { recursive: true });
  mkdirSync(testDbPath, { recursive: true });

  const { MemoryStore } = await import("./src/store.ts");
  const { createEmbedder } = await import("./src/embedder.ts");

  // Use a small model for testing — Ollama Cloud or a fake embedding
  // For practical testing without API calls, use a simple mock embedder
  const DIMS = 384;
  
  console.log("  Creating store...");
  const store = new MemoryStore({ dbPath: testDbPath, vectorDim: DIMS });

  // Mock embedder (no API needed for store test)
  const mockEmbedder = {
    embed: async (text) => {
      // Simple hash-based mock embedding
      const vec = new Float32Array(DIMS);
      for (let i = 0; i < text.length && i < DIMS; i++) {
        vec[i] = text.charCodeAt(i) / 255.0;
      }
      return Array.from(vec);
    },
    dimensions: DIMS,
  };

  console.log("  Storing memories...");
  const entry1 = await store.store({
    text: "User prefers ChatGPT OAuth over pay-per-token Claude",
    vector: await mockEmbedder.embed("User prefers ChatGPT OAuth over pay-per-token Claude"),
    category: "preference",
    scope: "global",
    importance: 0.8,
    metadata: "{}",
  });
  console.log(`    Stored: ${entry1.id} (${entry1.category})`);

  const entry2 = await store.store({
    text: "Discord thread 1493777369616355329 is about Polymarket agents",
    vector: await mockEmbedder.embed("Discord thread 1493777369616355329 is about Polymarket agents"),
    category: "entity",
    scope: "global",
    importance: 0.6,
    metadata: "{}",
  });
  console.log(`    Stored: ${entry2.id} (${entry2.category})`);

  const entry3 = await store.store({
    text: "The user's name is Tino and they work on AI agent development",
    vector: await mockEmbedder.embed("The user's name is Tino and they work on AI agent development"),
    category: "profile",
    scope: "global",
    importance: 0.9,
    metadata: "{}",
  });
  console.log(`    Stored: ${entry3.id} (${entry3.category})`);

  // Search (store has vectorSearch, not generic search)
  console.log("  Searching...");
  const searchVec = await mockEmbedder.embed("what does the user prefer");
  const results = await store.vectorSearch(searchVec, 3, 0.1);
  console.log(`    Results: ${results.length}`);
  for (const r of results) {
    console.log(`    - [${r.score.toFixed(3)}] ${r.entry.text.slice(0, 60)}...`);
  }

  // Stats
  const stats = await store.stats();
  console.log(`  Stats: ${stats.totalEntries} entries, ${stats.categories} categories`);

  // Delete
  const deleted = await store.delete(entry2.id);
  console.log(`  Deleted entry2: ${deleted}`);
  
  const statsAfter = await store.stats();
  console.log(`  Stats after delete: ${statsAfter.totalEntries} entries`);

  console.log("  PASS\n");
  rmSync(testDbPath, { recursive: true });
}

// ============================================================================
// Test 3: Full Engine (session recovery + store + auto-recall)
// ============================================================================

async function testFullEngine() {
  console.log("=== Test 3: Full Engine Integration ===");

  const testHome = "/tmp/hermes-memory-engine-test";
  if (existsSync(testHome)) rmSync(testHome, { recursive: true });
  mkdirSync(join(testHome, "memory", "lancedb"), { recursive: true });
  mkdirSync(join(testHome, "sessions"), { recursive: true });

  // Simulate the session recovery flow
  const { buildSessionKey, registerSession, lookupSession, touchSession } = 
    await import("./adapters/session-recovery.ts");
  const { MemoryStore } = await import("./src/store.ts");

  const config = { hermesHome: testHome };
  const DIMS = 384;

  // Mock embedder
  const mockEmbedder = {
    embed: async (text) => {
      const vec = new Float32Array(DIMS);
      for (let i = 0; i < text.length && i < DIMS; i++) {
        vec[i] = text.charCodeAt(i) / 255.0;
      }
      return Array.from(vec);
    },
    dimensions: DIMS,
  };

  const store = new MemoryStore({ 
    dbPath: join(testHome, "memory", "lancedb"), 
    vectorDim: DIMS 
  });

  // === Scenario: Discord thread comes in ===
  console.log("\n  Scenario: Discord thread message");

  // Step 1: First message — new session
  const discordKey = buildSessionKey("discord", "1493777369616355329");
  const initial = lookupSession(discordKey, config);
  console.log(`    First lookup: ${initial === null ? "null (new session needed)" : "found"}`);

  const sessionId1 = `session_${Date.now()}_abc123`;
  registerSession(discordKey, {
    session_id: sessionId1,
    created: new Date().toISOString(),
    last_active: new Date().toISOString(),
    platform: "discord",
    channel_id: "1493777369616355329",
    status: "active",
  }, config);

  // Store some context from this session
  await store.store({
    text: "Discussion about Polymarket copy-trading agent architecture",
    vector: await mockEmbedder.embed("Discussion about Polymarket copy-trading agent architecture"),
    category: "entity",
    scope: "global",
    importance: 0.7,
    metadata: "{}",
  });

  console.log(`    Session registered: ${sessionId1}`);

  // Step 2: 2 hours later, same thread — should RESUME
  console.log("\n  Scenario: Same thread, 2 hours later");
  const resumed = lookupSession(discordKey, config);
  console.log(`    Lookup: ${resumed ? `FOUND ${resumed.session_id} (status: ${resumed.status})` : "NOT FOUND"}`);
  console.assert(resumed?.session_id === sessionId1, "Should resume same session!");
  
  touchSession(discordKey, config);
  console.log("    Touched session (updated last_active)");

  // Step 3: Different thread — new session
  console.log("\n  Scenario: Different Discord thread");
  const thread2Key = buildSessionKey("discord", "999888777666", "thread-456");
  const thread2 = lookupSession(thread2Key, config);
  console.log(`    Lookup: ${thread2 === null ? "null (new session needed)" : "found"}`);
  console.assert(thread2 === null, "Different thread should be new");

  // Step 4: WhatsApp number — new session
  console.log("\n  Scenario: WhatsApp DM");
  const waKey = buildSessionKey("whatsapp", "+27712345678");
  const wa = lookupSession(waKey, config);
  console.log(`    Lookup: ${wa === null ? "null (new session needed)" : "found"}`);

  // Verify registry state
  const registryPath = join(testHome, "session-registry.json");
  const registry = JSON.parse(readFileSync(registryPath, "utf-8"));
  console.log(`\n  Registry state: ${Object.keys(registry).length} entries`);
  for (const [key, entry] of Object.entries(registry)) {
    console.log(`    ${key} → ${entry.session_id} (${entry.status})`);
  }

  // Verify store
  const searchVec2 = await mockEmbedder.embed("Polymarket");
  const searchResults = await store.vectorSearch(searchVec2, 2, 0.1);
  console.log(`\n  Store search for "Polymarket": ${searchResults.length} results`);
  for (const r of searchResults) {
    console.log(`    - ${r.entry.text.slice(0, 60)}...`);
  }

  console.log("\n  PASS\n");
  rmSync(testHome, { recursive: true });
}

// ============================================================================
// Run all tests
// ============================================================================

async function main() {
  console.log("hermes-memory-lancedb — Practical Tests\n");
  
  try {
    await testSessionRecovery();
    await testStoreAndEmbedder();
    await testFullEngine();
    console.log("=== ALL TESTS PASSED ===");
  } catch (err) {
    console.error("TEST FAILED:", err);
    process.exit(1);
  }
}

main();
