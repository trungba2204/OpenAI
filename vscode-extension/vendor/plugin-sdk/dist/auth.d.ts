import { PluginClient } from './client';
import { AuthTokens } from './types';
export declare class PluginAuth {
    private client;
    constructor(client: PluginClient);
    login(email: string, password: string): Promise<AuthTokens>;
    pollDeviceCode(code: string): Promise<AuthTokens>;
    logout(refreshToken: string): Promise<void>;
}
