"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthManager = void 0;
const vscode = __importStar(require("vscode"));
const plugin_sdk_1 = require("@ai-platform/plugin-sdk");
const TOKEN_KEY = 'aiPlatform.tokens';
class AuthManager {
    constructor(context) {
        this.context = context;
        this.tokens = null;
        const apiUrl = vscode.workspace.getConfiguration('aiPlatform').get('apiUrl')
            || 'http://localhost:8080/api/plugin';
        this.sdk = (0, plugin_sdk_1.createPluginSdk)({
            baseUrl: apiUrl,
            getTokens: () => this.tokens,
            setTokens: t => { this.tokens = t; },
            onUnauthorized: () => { this.tokens = null; }
        });
    }
    get api() { return this.sdk.api; }
    get auth() { return this.sdk.auth; }
    async init() {
        const raw = await this.context.secrets.get(TOKEN_KEY);
        if (raw) {
            try {
                this.tokens = JSON.parse(raw);
            }
            catch {
                this.tokens = null;
            }
        }
    }
    isLoggedIn() {
        return !!this.tokens?.accessToken;
    }
    async saveTokens(tokens) {
        this.tokens = tokens;
        await this.context.secrets.store(TOKEN_KEY, JSON.stringify(tokens));
    }
    async logout() {
        if (this.tokens?.refreshToken) {
            try {
                await this.auth.logout(this.tokens.refreshToken);
            }
            catch { /* ignore */ }
        }
        this.tokens = null;
        await this.context.secrets.delete(TOKEN_KEY);
    }
    async connectWithDeviceCode() {
        const code = await vscode.window.showInputBox({
            prompt: 'Nhập mã 6 ký tự từ web (Plugins → Kết nối)',
            placeHolder: 'ABC123',
            validateInput: v => v.length === 6 ? null : 'Mã phải có 6 ký tự'
        });
        if (!code)
            return false;
        try {
            const tokens = await this.auth.pollDeviceCode(code.toUpperCase());
            await this.saveTokens({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenType: tokens.tokenType || 'Bearer'
            });
            vscode.window.showInformationMessage('AI Platform: Đã kết nối thành công!');
            return true;
        }
        catch (e) {
            vscode.window.showErrorMessage(`Kết nối thất bại: ${e instanceof Error ? e.message : e}`);
            return false;
        }
    }
}
exports.AuthManager = AuthManager;
//# sourceMappingURL=authManager.js.map