/**
 * Smart Memory Extractor — LLM-powered extraction pipeline
 * Replaces regex-triggered capture with intelligent 6-category extraction.
 *
 * Pipeline: conversation → LLM extract → candidates → dedup → persist
 *
 */
import type { MemoryStore } from "./store.js";
import type { Embedder } from "./embedder.js";
import type { LlmClient } from "./llm-client.js";
import { type AdmissionControlConfig, type AdmissionRejectionAuditEntry } from "./admission-control.js";
import { type ExtractionStats } from "./memory-categories.js";
import type { NoisePrototypeBank } from "./noise-prototypes.js";
import { type WorkspaceBoundaryConfig } from "./workspace-boundary.js";
/**
 * Strip platform envelope metadata injected by OpenClaw channels before
 * the conversation text reaches the extraction LLM. These envelopes contain
 * message IDs, sender IDs, timestamps, and JSON metadata blocks that have
 * zero informational value for memory extraction but get stored verbatim
 * by weaker LLMs (e.g. qwen) that can't distinguish metadata from content.
 *
 * Targets:
 * - "System: [YYYY-MM-DD HH:MM:SS GMT+N] Channel[account] ..." header lines
 * - "Conversation info (untrusted metadata):" + JSON code blocks
 * - "Sender (untrusted metadata):" + JSON code blocks
 * - "Replied message (untrusted, for context):" + JSON code blocks
 * - Standalone JSON blocks containing message_id/sender_id fields
 *
 * Note: stripLeadingRuntimeWrappers and stripRuntimeWrapperBoilerplate from
 * the old implementation are dead code after this refactor — they are not
 * called anywhere in the pipeline. They have been removed.
 */
export declare function stripEnvelopeMetadata(text: string): string;
export interface SmartExtractorConfig {
    /** User identifier for extraction prompt. */
    user?: string;
    /** Minimum conversation messages before extraction triggers. */
    extractMinMessages?: number;
    /** Maximum characters of conversation text to process. */
    extractMaxChars?: number;
    /** Default scope for new memories. */
    defaultScope?: string;
    /** Logger function. */
    log?: (msg: string) => void;
    /** Debug logger function. */
    debugLog?: (msg: string) => void;
    /** Optional embedding-based noise prototype bank for language-agnostic noise filtering. */
    noiseBank?: NoisePrototypeBank;
    /** Facts reserved for workspace-managed USER.md should never enter LanceDB. */
    workspaceBoundary?: WorkspaceBoundaryConfig;
    /** Optional admission-control governance layer before downstream dedup/persistence. */
    admissionControl?: AdmissionControlConfig;
    /** Optional sink for durable reject-audit logging. */
    onAdmissionRejected?: (entry: AdmissionRejectionAuditEntry) => Promise<void> | void;
}
export interface ExtractPersistOptions {
    /** Target scope for newly created memories. */
    scope?: string;
    /**
     * Optional store-layer scope filter override used for dedup/merge reads.
     * - omit the field to default reads to `[scope ?? defaultScope]`
     * - set `undefined` explicitly to preserve trusted full-bypass callers
     * - pass `[]` to force deny-all reads (match nothing)
     * - pass a non-empty array to restrict reads to those scopes
     */
    scopeFilter?: string[];
}
export declare class SmartExtractor {
    private store;
    private embedder;
    private llm;
    private config;
    private log;
    private debugLog;
    private admissionController;
    private persistAdmissionAudit;
    private onAdmissionRejected?;
    constructor(store: MemoryStore, embedder: Embedder, llm: LlmClient, config?: SmartExtractorConfig);
    /**
     * Extract memories from a conversation text and persist them.
     * Returns extraction statistics.
     */
    extractAndPersist(conversationText: string, sessionKey?: string, options?: ExtractPersistOptions): Promise<ExtractionStats>;
    /**
     * Filter out texts that match noise prototypes by embedding similarity.
     * Long texts (>300 chars) are passed through without checking.
     * Only active when noiseBank is configured and initialized.
     *
     * Uses batch embedding to reduce API round-trips from N to 1.
     */
    filterNoiseByEmbedding(texts: string[]): Promise<string[]>;
    /**
     * Feed back conversation text to the noise prototype bank.
     * Called when LLM extraction returns zero candidates (strongest noise signal).
     */
    private learnAsNoise;
    /**
     * Call LLM to extract candidate memories from conversation text.
     */
    private extractCandidates;
    /**
     * Process a single candidate memory: dedup → merge/create → store
     *
     * @param precomputedVector - Optional pre-embedded vector for the candidate.
     *   When provided (from batch pre-embedding), skips the per-candidate embed
     *   call to reduce API round-trips.
     */
    private processCandidate;
    /**
     * Two-stage dedup: vector similarity search → LLM decision.
     */
    private deduplicate;
    private llmDedupDecision;
    /**
     * Profile always-merge: read existing profile, merge with LLM, upsert.
     */
    private handleProfileMerge;
    /**
     * Merge a candidate into an existing memory using LLM.
     */
    private handleMerge;
    /**
     * Handle SUPERSEDE: preserve the old record as historical but mark it as no
     * longer current, then create the new active fact.
     */
    private handleSupersede;
    /**
     * Handle SUPPORT: update support stats on existing memory for a specific context.
     */
    private handleSupport;
    /**
     * Handle CONTEXTUALIZE: create a new entry that adds situational nuance,
     * linked to the original via a relation in metadata.
     */
    private handleContextualize;
    /**
     * Handle CONTRADICT: create contradicting entry + record contradiction evidence
     * on the original memory's support stats.
     */
    private handleContradict;
    /**
     * Store a candidate memory as a new entry with L0/L1/L2 metadata.
     */
    private storeCandidate;
    /**
     * Map 6-category to existing 5-category store type for backward compatibility.
     */
    private mapToStoreCategory;
    /**
     * Get default importance score by category.
     */
    private getDefaultImportance;
    /**
     * Embed admission audit record into metadata if audit persistence is enabled.
     */
    private withAdmissionAudit;
    /**
     * Record a rejected admission to the durable audit log.
     */
    private recordRejectedAdmission;
}
export interface ExtractionRateLimiterOptions {
    /** Maximum number of extractions allowed per hour (default: 30) */
    maxExtractionsPerHour?: number;
}
export interface ExtractionRateLimiter {
    /** Check whether the current rate would exceed the limit */
    isRateLimited(): boolean;
    /** Record a new extraction timestamp */
    recordExtraction(): void;
    /** Get the number of extractions in the current window */
    getRecentCount(): number;
}
/**
 * Create an extraction rate limiter that tracks timestamps in a sliding
 * one-hour window.
 */
export declare function createExtractionRateLimiter(options?: ExtractionRateLimiterOptions): ExtractionRateLimiter;
//# sourceMappingURL=smart-extractor.d.ts.map