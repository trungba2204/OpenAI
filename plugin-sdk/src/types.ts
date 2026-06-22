export type PluginEditorType = 'VSCODE' | 'INTELLIJ' | 'ECLIPSE' | 'CURSOR' | 'WINDSURF' | 'OTHER';

export interface PluginSelection {
  startLine?: number;
  endLine?: number;
  text?: string;
}

export interface PluginContextPayload {
  editorType?: PluginEditorType;
  projectName?: string;
  activeFile?: string;
  language?: string;
  selection?: PluginSelection;
  openFiles?: string[];
  fileTree?: string;
  activeFileContent?: string;
  extensionVersion?: string;
}

export interface AiModelInfo {
  id: string;
  modelId: string;
  displayName: string;
}

export type PluginChatMode = 'ask' | 'edit' | 'plan';

export type PluginAttachmentKind = 'snippet' | 'file' | 'image';

export interface PluginAttachment {
  kind: PluginAttachmentKind;
  name: string;
  path?: string;
  startLine?: number;
  endLine?: number;
  content: string;
  mimeType?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface PluginChatRequest {
  context?: PluginContextPayload;
  message: string;
  model?: string;
  knowledgeBaseId?: number;
  attachments?: PluginAttachment[];
}

export interface PluginChatResponse {
  answer: string;
  sources?: string[];
}

export interface PluginInlineRequest {
  context?: PluginContextPayload;
  action: string;
  code?: string;
  instruction?: string;
  startLine?: number;
  endLine?: number;
  model?: string;
  attachments?: PluginAttachment[];
}

export interface PluginInlineResponse {
  result: string;
}

export interface PluginCompletionRequest {
  context?: PluginContextPayload;
  prefix?: string;
  suffix?: string;
  model?: string;
}

export interface PluginCompletionResponse {
  completion: string;
}
