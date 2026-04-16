import type { LlmClient } from "./llm-client.js";
import type { CandidateMemory, MemoryCategory } from "./memory-categories.js";
import type { MemorySearchResult, MemoryStore } from "./store.js";
export interface AdmissionWeights {
    utility: number;
    confidence: number;
    novelty: number;
    recency: number;
    typePrior: number;
}
export interface AdmissionTypePriors {
    profile: number;
    preferences: number;
    entities: number;
    events: number;
    cases: number;
    patterns: number;
}
export interface AdmissionRecencyConfig {
    halfLifeDays: number;
}
export type AdmissionControlPreset = "balanced" | "conservative" | "high-recall";
export interface AdmissionControlConfig {
    preset: AdmissionControlPreset;
    enabled: boolean;
    utilityMode: "standalone" | "off";
    weights: AdmissionWeights;
    rejectThreshold: number;
    admitThreshold: number;
    noveltyCandidatePoolSize: number;
    recency: AdmissionRecencyConfig;
    typePriors: AdmissionTypePriors;
    auditMetadata: boolean;
    persistRejectedAudits: boolean;
    rejectedAuditFilePath?: string;
}
export interface AdmissionFeatureScores {
    utility: number;
    confidence: number;
    novelty: number;
    recency: number;
    typePrior: number;
}
export interface AdmissionAuditRecord {
    version: "amac-v1";
    decision: "reject" | "pass_to_dedup";
    hint?: "add" | "update_or_merge";
    score: number;
    reason: string;
    utility_reason?: string;
    thresholds: {
        reject: number;
        admit: number;
    };
    weights: AdmissionWeights;
    feature_scores: AdmissionFeatureScores;
    matched_existing_memory_ids: string[];
    compared_existing_memory_ids: string[];
    max_similarity: number;
    evaluated_at: number;
}
export interface AdmissionEvaluation {
    decision: "reject" | "pass_to_dedup";
    hint?: "add" | "update_or_merge";
    audit: AdmissionAuditRecord;
}
export interface AdmissionRejectionAuditEntry {
    version: "amac-v1";
    rejected_at: number;
    session_key: string;
    target_scope: string;
    scope_filter: string[];
    candidate: CandidateMemory;
    audit: AdmissionAuditRecord & {
        decision: "reject";
    };
    conversation_excerpt: string;
}
export interface ConfidenceSupportBreakdown {
    score: number;
    bestSupport: number;
    coverage: number;
    unsupportedRatio: number;
}
export interface NoveltyBreakdown {
    score: number;
    maxSimilarity: number;
    matchedIds: string[];
    comparedIds: string[];
}
export declare const ADMISSION_CONTROL_PRESETS: Record<AdmissionControlPreset, AdmissionControlConfig>;
export declare const DEFAULT_ADMISSION_CONTROL_CONFIG: AdmissionControlConfig;
export declare function normalizeAdmissionControlConfig(raw: unknown): AdmissionControlConfig;
export declare function resolveRejectedAuditFilePath(dbPath: string, config?: Pick<AdmissionControlConfig, "rejectedAuditFilePath"> | null): string;
export declare function scoreTypePrior(category: MemoryCategory, typePriors: AdmissionTypePriors): number;
export declare function scoreConfidenceSupport(candidate: CandidateMemory, conversationText: string): ConfidenceSupportBreakdown;
export declare function scoreNoveltyFromMatches(candidateVector: number[], matches: MemorySearchResult[]): NoveltyBreakdown;
export declare function scoreRecencyGap(now: number, matches: MemorySearchResult[], halfLifeDays: number): number;
export declare class AdmissionController {
    private readonly store;
    private readonly llm;
    private readonly config;
    private readonly debugLog;
    constructor(store: MemoryStore, llm: LlmClient, config: AdmissionControlConfig, debugLog?: (msg: string) => void);
    private loadRelevantMatches;
    evaluate(params: {
        candidate: CandidateMemory;
        candidateVector: number[];
        conversationText: string;
        scopeFilter: string[];
        now?: number;
    }): Promise<AdmissionEvaluation>;
}
//# sourceMappingURL=admission-control.d.ts.map