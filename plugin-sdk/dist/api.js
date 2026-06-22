"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PluginApi = void 0;
class PluginApi {
    constructor(client) {
        this.client = client;
    }
    chat(req) {
        return this.client.post('/chat', req);
    }
    inline(req) {
        return this.client.post('/inline', req);
    }
    completion(req) {
        return this.client.post('/completion', req);
    }
    agent(req) {
        return this.client.post('/agent', req);
    }
    knowledgeChat(req) {
        return this.client.post('/knowledge-chat', req);
    }
    registerContext(ctx) {
        return this.client.post('/context', ctx);
    }
    listModels() {
        return this.client.get('/models');
    }
}
exports.PluginApi = PluginApi;
