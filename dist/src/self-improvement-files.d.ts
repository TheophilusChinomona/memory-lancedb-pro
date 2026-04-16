export declare const DEFAULT_LEARNINGS_TEMPLATE = "# Learnings\n\nAppend structured entries:\n- LRN-YYYYMMDD-XXX for corrections / best practices / knowledge gaps\n- Include summary, details, suggested action, metadata, and status";
export declare const DEFAULT_ERRORS_TEMPLATE = "# Errors\n\nAppend structured entries:\n- ERR-YYYYMMDD-XXX for command/tool/integration failures\n- Include symptom, context, probable cause, and prevention";
export declare function ensureSelfImprovementLearningFiles(baseDir: string): Promise<void>;
export interface AppendSelfImprovementEntryParams {
    baseDir: string;
    type: "learning" | "error";
    summary: string;
    details?: string;
    suggestedAction?: string;
    category?: string;
    area?: string;
    priority?: string;
    status?: string;
    source?: string;
}
export declare function appendSelfImprovementEntry(params: AppendSelfImprovementEntryParams): Promise<{
    id: string;
    filePath: string;
}>;
//# sourceMappingURL=self-improvement-files.d.ts.map