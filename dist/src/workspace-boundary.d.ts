export interface UserMdExclusiveConfig {
    enabled?: boolean;
    routeProfile?: boolean;
    routeCanonicalName?: boolean;
    routeCanonicalAddressing?: boolean;
    filterRecall?: boolean;
}
export interface WorkspaceBoundaryConfig {
    userMdExclusive?: UserMdExclusiveConfig;
}
export interface ResolvedUserMdExclusiveConfig {
    enabled: boolean;
    routeProfile: boolean;
    routeCanonicalName: boolean;
    routeCanonicalAddressing: boolean;
    filterRecall: boolean;
}
type BoundaryEntryLike = {
    text: string;
    metadata?: string;
    category?: "preference" | "fact" | "decision" | "entity" | "other" | "reflection";
    importance?: number;
    timestamp?: number;
};
export declare function resolveUserMdExclusiveConfig(workspaceBoundary?: WorkspaceBoundaryConfig | null): ResolvedUserMdExclusiveConfig;
export declare function shouldFilterUserMdExclusiveRecall(workspaceBoundary?: WorkspaceBoundaryConfig | null): boolean;
export declare function isUserMdExclusiveMemory(params: {
    memoryCategory?: string;
    factKey?: string;
    text?: string;
    abstract?: string;
    overview?: string;
    content?: string;
}, workspaceBoundary?: WorkspaceBoundaryConfig | null): boolean;
export declare function isUserMdExclusiveEntry(entry: BoundaryEntryLike, workspaceBoundary?: WorkspaceBoundaryConfig | null): boolean;
export declare function filterUserMdExclusiveRecallResults<T extends {
    entry: BoundaryEntryLike;
}>(results: T[], workspaceBoundary?: WorkspaceBoundaryConfig | null): T[];
export {};
//# sourceMappingURL=workspace-boundary.d.ts.map