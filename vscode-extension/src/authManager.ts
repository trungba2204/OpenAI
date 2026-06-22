import * as vscode from 'vscode';
import { createPluginSdk, AuthTokens } from '@ai-platform/plugin-sdk';

const TOKEN_KEY = 'aiPlatform.tokens';

export class AuthManager {
  private sdk: ReturnType<typeof createPluginSdk>;
  private tokens: AuthTokens | null = null;

  constructor(private context: vscode.ExtensionContext) {
    const apiUrl = vscode.workspace.getConfiguration('aiPlatform').get<string>('apiUrl')
      || 'http://localhost:8080/api/plugin';
    this.sdk = createPluginSdk({
      baseUrl: apiUrl,
      getTokens: () => this.tokens,
      setTokens: t => { this.tokens = t; },
      onUnauthorized: () => { this.tokens = null; }
    });
  }

  get api() { return this.sdk.api; }
  get auth() { return this.sdk.auth; }

  async init(): Promise<void> {
    const raw = await this.context.secrets.get(TOKEN_KEY);
    if (raw) {
      try {
        this.tokens = JSON.parse(raw);
      } catch {
        this.tokens = null;
      }
    }
  }

  isLoggedIn(): boolean {
    return !!this.tokens?.accessToken;
  }

  async saveTokens(tokens: AuthTokens): Promise<void> {
    this.tokens = tokens;
    await this.context.secrets.store(TOKEN_KEY, JSON.stringify(tokens));
  }

  async logout(): Promise<void> {
    if (this.tokens?.refreshToken) {
      try {
        await this.auth.logout(this.tokens.refreshToken);
      } catch { /* ignore */ }
    }
    this.tokens = null;
    await this.context.secrets.delete(TOKEN_KEY);
  }

  async connectWithDeviceCode(): Promise<boolean> {
    const code = await vscode.window.showInputBox({
      prompt: 'Nhập mã 6 ký tự từ web (Plugins → Kết nối)',
      placeHolder: 'ABC123',
      validateInput: v => v.length === 6 ? null : 'Mã phải có 6 ký tự'
    });
    if (!code) return false;

    try {
      const tokens = await this.auth.pollDeviceCode(code.toUpperCase());
      await this.saveTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenType: tokens.tokenType || 'Bearer'
      });
      vscode.window.showInformationMessage('AI Platform: Đã kết nối thành công!');
      return true;
    } catch (e) {
      vscode.window.showErrorMessage(`Kết nối thất bại: ${e instanceof Error ? e.message : e}`);
      return false;
    }
  }
}
