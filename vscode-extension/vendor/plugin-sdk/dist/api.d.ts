import { PluginClient } from './client';
import { AiModelInfo, PluginChatRequest, PluginChatResponse, PluginCompletionRequest, PluginCompletionResponse, PluginContextPayload, PluginInlineRequest, PluginInlineResponse } from './types';
export declare class PluginApi {
    private client;
    constructor(client: PluginClient);
    chat(req: PluginChatRequest): Promise<PluginChatResponse>;
    inline(req: PluginInlineRequest): Promise<PluginInlineResponse>;
    completion(req: PluginCompletionRequest): Promise<PluginCompletionResponse>;
    agent(req: PluginChatRequest): Promise<PluginChatResponse>;
    knowledgeChat(req: PluginChatRequest): Promise<PluginChatResponse>;
    registerContext(ctx: PluginContextPayload): Promise<void>;
    listModels(): Promise<AiModelInfo[]>;
}
