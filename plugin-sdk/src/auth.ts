import { PluginClient } from './client';
import { AuthTokens } from './types';

export class PluginAuth {
  constructor(private client: PluginClient) {}

  async login(email: string, password: string): Promise<AuthTokens> {
    const data = await this.client.post<AuthTokens & { user?: unknown }>('/auth/login', { email, password }, false);
    return { accessToken: data.accessToken, refreshToken: data.refreshToken, tokenType: data.tokenType || 'Bearer' };
  }

  async pollDeviceCode(code: string): Promise<AuthTokens> {
    const data = await this.client.post<AuthTokens & { user?: unknown }>('/auth/device/poll', { code }, false);
    return { accessToken: data.accessToken, refreshToken: data.refreshToken, tokenType: data.tokenType || 'Bearer' };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.client.post('/auth/logout', { refreshToken }, true);
  }
}
