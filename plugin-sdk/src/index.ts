export * from './types';
export { PluginClient, PluginClientOptions } from './client';
export { PluginAuth } from './auth';
export { PluginApi } from './api';

import { PluginClient, PluginClientOptions } from './client';
import { PluginAuth } from './auth';
import { PluginApi } from './api';

export function createPluginSdk(options: PluginClientOptions) {
  const client = new PluginClient(options);
  return {
    client,
    auth: new PluginAuth(client),
    api: new PluginApi(client)
  };
}
