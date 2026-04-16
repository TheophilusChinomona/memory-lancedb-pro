export interface OAuthLoginOptions {
    authPath: string;
    timeoutMs?: number;
    noBrowser?: boolean;
    model?: string;
    providerId?: string;
    onOpenUrl?: (url: string) => void | Promise<void>;
    onAuthorizeUrl?: (url: string) => void | Promise<void>;
}
export type OAuthProviderId = "openai-codex";
interface OAuthProviderDefinition {
    id: OAuthProviderId;
    label: string;
    authorizeUrl: string;
    tokenUrl: string;
    clientId: string;
    redirectUri: string;
    scope: string;
    accountIdClaim: string;
    backendBaseUrl: string;
    defaultModel: string;
    modelPattern: RegExp;
    extraAuthorizeParams?: Record<string, string>;
}
export interface OAuthSession {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: number;
    accountId: string;
    providerId: OAuthProviderId;
    authPath: string;
}
export declare function listOAuthProviders(): Array<Pick<OAuthProviderDefinition, "id" | "label" | "defaultModel">>;
export declare function normalizeOAuthProviderId(providerId?: string): OAuthProviderId;
export declare function getOAuthProvider(providerId?: string): OAuthProviderDefinition;
export declare function getOAuthProviderLabel(providerId?: string): string;
export declare function getDefaultOauthModelForProvider(providerId?: string): string;
export declare function isOauthModelSupported(providerId: string | undefined, value: string | undefined): boolean;
export declare function loadOAuthSession(authPath: string): Promise<OAuthSession>;
export declare function needsRefresh(session: OAuthSession): boolean;
export declare function refreshOAuthSession(session: OAuthSession, timeoutMs?: number): Promise<OAuthSession>;
export declare function saveOAuthSession(authPath: string, session: OAuthSession): Promise<void>;
export declare function resolveOAuthCallbackListenHost(redirectUri: URL | string): string;
export declare function performOAuthLogin(options: OAuthLoginOptions): Promise<{
    session: OAuthSession;
    authorizeUrl: string;
}>;
export declare function normalizeOauthModel(model: string): string;
export declare function buildOauthEndpoint(baseURL?: string, providerId?: string): string;
export declare function extractOutputTextFromSse(bodyText: string): string | null;
export {};
//# sourceMappingURL=llm-oauth.d.ts.map