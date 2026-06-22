"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginClient = void 0;
class PluginClient {
    constructor(options) {
        this.options = options;
    }
    get baseUrl() {
        return this.options.baseUrl.replace(/\/$/, '');
    }
    async post(path, body, auth = true) {
        const headers = { 'Content-Type': 'application/json' };
        if (auth) {
            const tokens = this.options.getTokens();
            if (!tokens?.accessToken)
                throw new Error('Not authenticated');
            headers['Authorization'] = `Bearer ${tokens.accessToken}`;
        }
        const res = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        if (res.status === 401 && auth) {
            const refreshed = await this.tryRefresh();
            if (refreshed)
                return this.post(path, body, true);
            this.options.onUnauthorized?.();
            throw new Error('Unauthorized');
        }
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `HTTP ${res.status}`);
        }
        if (res.status === 204)
            return undefined;
        return res.json();
    }
    async get(path) {
        const tokens = this.options.getTokens();
        if (!tokens?.accessToken)
            throw new Error('Not authenticated');
        const res = await fetch(`${this.baseUrl}${path}`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        return res.json();
    }
    async tryRefresh() {
        const tokens = this.options.getTokens();
        if (!tokens?.refreshToken)
            return false;
        try {
            const res = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: tokens.refreshToken })
            });
            if (!res.ok)
                return false;
            const data = await res.json();
            this.options.setTokens({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                tokenType: data.tokenType || 'Bearer'
            });
            return true;
        }
        catch {
            return false;
        }
    }
}
exports.PluginClient = PluginClient;
