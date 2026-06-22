import { AuthTokens } from './types';
export interface PluginClientOptions {
    baseUrl: string;
    getTokens: () => AuthTokens | null;
    setTokens: (tokens: AuthTokens | null) => void;
    onUnauthorized?: () => void;
}
export declare class PluginClient {
    private options;
    constructor(options: PluginClientOptions);
    get baseUrl(): string;
    post<T>(path: string, body: unknown, auth?: boolean): Promise<T>;
    get<T>(path: string): Promise<T>;
    private tryRefresh;
}
