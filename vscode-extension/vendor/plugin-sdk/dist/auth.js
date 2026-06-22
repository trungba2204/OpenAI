"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginAuth = void 0;
class PluginAuth {
    constructor(client) {
        this.client = client;
    }
    async login(email, password) {
        const data = await this.client.post('/auth/login', { email, password }, false);
        return { accessToken: data.accessToken, refreshToken: data.refreshToken, tokenType: data.tokenType || 'Bearer' };
    }
    async pollDeviceCode(code) {
        const data = await this.client.post('/auth/device/poll', { code }, false);
        return { accessToken: data.accessToken, refreshToken: data.refreshToken, tokenType: data.tokenType || 'Bearer' };
    }
    async logout(refreshToken) {
        await this.client.post('/auth/logout', { refreshToken }, true);
    }
}
exports.PluginAuth = PluginAuth;
