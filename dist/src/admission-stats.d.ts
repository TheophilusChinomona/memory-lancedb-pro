import type { AdmissionControlConfig, AdmissionRejectionAuditEntry } from "./admission-control.js";
export interface AdmissionAuditedMemoryLike {
    metadata?: string;
    timestamp?: number;
    category?: string;
    text?: string;
    importance?: number;
}
export interface AdmissionStatsStoreLike {
    dbPath: string;
    list?: (scopeFilter?: string[], category?: string, limit?: number, offset?: number) => Promise<AdmissionAuditedMemoryLike[]>;
}
export interface AdmissionCategoryBreakdown {
    admittedCount: number | null;
    rejectedCount: number;
    totalObserved: number | null;
    rejectRate: number | null;
}
export interface AdmissionWindowBreakdown {
    admittedCount: number | null;
    rejectedCount: number;
    totalObserved: number | null;
    rejectRate: number | null;
}
export interface AdmissionRejectionReasonCount {
    label: string;
    count: number;
}
export interface AdmissionRejectionSummary {
    total: number;
    latestRejectedAt: number | null;
    byCategory: Record<string, number>;
    byScope: Record<string, number>;
    topReasons: AdmissionRejectionReasonCount[];
}
export interface AdmissionStatsSummary {
    enabled: boolean;
    auditMetadataEnabled: boolean;
    rejectedAuditFilePath: string;
    rejectedCount: number;
    admittedCount: number | null;
    totalObserved: number | null;
    rejectRate: number | null;
    latestRejectedAt: number | null;
    rejectedByCategory: Record<string, number>;
    rejectedByScope: Record<string, number>;
    categoryBreakdown: Record<string, AdmissionCategoryBreakdown>;
    topReasons: AdmissionRejectionReasonCount[];
    windows: Record<string, AdmissionWindowBreakdown>;
    observedAuditedMemories: number;
}
export declare function readAdmissionRejectionAudits(filePath: string): Promise<AdmissionRejectionAuditEntry[]>;
export declare function normalizeReasonKey(reason: string): string;
export declare function extractAdmissionReasonLabel(entry: AdmissionRejectionAuditEntry): string;
export declare function summarizeAdmissionRejections(entries: AdmissionRejectionAuditEntry[]): AdmissionRejectionSummary;
export declare function getAdmissionAuditDecision(entry: {
    metadata?: string;
}): "pass_to_dedup" | "reject" | null;
export declare function getAdmittedDecisionTimestamp(entry: {
    metadata?: string;
    timestamp?: number;
}): number | null;
export declare function getObservedAdmissionCategory(entry: AdmissionAuditedMemoryLike): string;
export declare function buildAdmissionCategoryBreakdown(admittedCategories: string[] | null, rejectedEntries: AdmissionRejectionAuditEntry[]): Record<string, AdmissionCategoryBreakdown>;
export declare function buildAdmissionWindowSummary(admittedTimestamps: number[] | null, rejectedEntries: AdmissionRejectionAuditEntry[], now?: number): Record<string, AdmissionWindowBreakdown>;
export declare function buildAdmissionStats(params: {
    store: AdmissionStatsStoreLike;
    admissionControl?: AdmissionControlConfig;
    scopeFilter?: string[];
    memoryTotalCount: number;
}): Promise<AdmissionStatsSummary>;
//# sourceMappingURL=admission-stats.d.ts.map