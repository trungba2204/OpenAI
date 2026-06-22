import { PluginClient } from './client';
import {
  AiModelInfo,
  PluginChatRequest,
  PluginChatResponse,
  PluginCompletionRequest,
  PluginCompletionResponse,
  PluginContextPayload,
  PluginInlineRequest,
  PluginInlineResponse
} from './types';

export class PluginApi {
  constructor(private client: PluginClient) {}

  chat(req: PluginChatRequest): Promise<PluginChatResponse> {
    return this.client.post('/chat', req);
  }

  inline(req: PluginInlineRequest): Promise<PluginInlineResponse> {
    return this.client.post('/inline', req);
  }

  completion(req: PluginCompletionRequest): Promise<PluginCompletionResponse> {
    return this.client.post('/completion', req);
  }

  agent(req: PluginChatRequest): Promise<PluginChatResponse> {
    return this.client.post('/agent', req);
  }

  knowledgeChat(req: PluginChatRequest): Promise<PluginChatResponse> {
    return this.client.post('/knowledge-chat', req);
  }

  registerContext(ctx: PluginContextPayload): Promise<void> {
    return this.client.post('/context', ctx);
  }

  listModels(): Promise<AiModelInfo[]> {
    return this.client.get('/models');
  }
}
