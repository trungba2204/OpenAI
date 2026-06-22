import { AuthTokens } from './types';

export interface PluginClientOptions {
  baseUrl: string;
  getTokens: () => AuthTokens | null;
  setTokens: (tokens: AuthTokens | null) => void;
  onUnauthorized?: () => void;
}

export class PluginClient {
  constructor(private options: PluginClientOptions) {}

  get baseUrl(): string {
    return this.options.baseUrl.replace(/\/$/, '');
  }

  async post<T>(path: string, body: unknown, auth = true): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth) {
      const tokens = this.options.getTokens();
      if (!tokens?.accessToken) throw new Error('Not authenticated');
      headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (res.status === 401 && auth) {
      const refreshed = await this.tryRefresh();
      if (refreshed) return this.post(path, body, true);
      this.options.onUnauthorized?.();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  async get<T>(path: string): Promise<T> {
    const tokens = this.options.getTokens();
    if (!tokens?.accessToken) throw new Error('Not authenticated');
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${tokens.accessToken}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
  }

  private async tryRefresh(): Promise<boolean> {
    const tokens = this.options.getTokens();
    if (!tokens?.refreshToken) return false;
    try {
      const res = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken })
      });
      if (!res.ok) return false;
      const data = await res.json();
      this.options.setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenType: data.tokenType || 'Bearer'
      });
      return true;
    } catch {
      return false;
    }
  }
}
