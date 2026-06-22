export * from './types';
export { PluginClient, PluginClientOptions } from './client';
export { PluginAuth } from './auth';
export { PluginApi } from './api';
import { PluginClient, PluginClientOptions } from './client';
import { PluginAuth } from './auth';
import { PluginApi } from './api';
export declare function createPluginSdk(options: PluginClientOptions): {
    client: PluginClient;
    auth: PluginAuth;
    api: PluginApi;
};
