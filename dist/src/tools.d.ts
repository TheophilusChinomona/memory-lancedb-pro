/**
 * Agent Tool Definitions
 * Memory management tools for AI agents
 */
import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import type { MemoryRetriever } from "./retriever.js";
import type { MemoryStore } from "./store.js";
import { type MemoryScopeManager } from "./scopes.js";
import type { Embedder } from "./embedder.js";
import { type WorkspaceBoundaryConfig } from "./workspace-boundary.js";
export declare const MEMORY_CATEGORIES: readonly ["preference", "fact", "decision", "entity", "reflection", "other"];
export type MdMirrorWriter = (entry: {
    text: string;
    category: string;
    scope: string;
    timestamp?: number;
}, meta?: {
    source?: string;
    agentId?: string;
}) => Promise<void>;
interface ToolContext {
    retriever: MemoryRetriever;
    store: MemoryStore;
    scopeManager: MemoryScopeManager;
    embedder: Embedder;
    agentId?: string;
    workspaceDir?: string;
    mdMirror?: MdMirrorWriter | null;
    workspaceBoundary?: WorkspaceBoundaryConfig;
}
/** @internal Exported for testing only — resets the missing-agent warning throttle. */
export declare function _resetWarnedMissingAgentIdState(): void;
export declare function registerSelfImprovementLogTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerSelfImprovementExtractSkillTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerSelfImprovementReviewTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerMemoryRecallTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerMemoryStoreTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerMemoryForgetTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerMemoryUpdateTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerMemoryStatsTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerMemoryDebugTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerMemoryListTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerMemoryPromoteTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerMemoryArchiveTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerMemoryCompactTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerMemoryExplainRankTool(api: OpenClawPluginApi, context: ToolContext): void;
export declare function registerAllMemoryTools(api: OpenClawPluginApi, context: ToolContext, options?: {
    enableManagementTools?: boolean;
    enableSelfImprovementTools?: boolean;
}): void;
export {};
//# sourceMappingURL=tools.d.ts.map