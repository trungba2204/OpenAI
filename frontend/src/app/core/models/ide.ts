export interface Workspace {
  id: number;
  name: string;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  workspaceId: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileTreeNode {
  id: number;
  name: string;
  path: string;
  directory: boolean;
  mimeType?: string;
  sizeBytes: number;
  children: FileTreeNode[];
}

export interface FileContent {
  id: number;
  name: string;
  path: string;
  content: string;
  mimeType?: string;
}

export interface IdeChatMessage {
  role: 'user' | 'assistant';
  content: string;
  displayContent?: string;
  animating?: boolean;
}

export type ContextScope = 'FILE' | 'FOLDER' | 'PROJECT' | 'RAG';
export type InlineAction = 'EXPLAIN' | 'REFACTOR' | 'OPTIMIZE' | 'TEST';

export interface IdeChatResponse {
  response: string;
}

export interface IdeFileEdit {
  path: string;
  content: string;
  create: boolean;
  partial?: boolean;
  startLine?: number;
  endLine?: number;
}

export interface IdeSelectionContext {
  startLine: number;
  endLine: number;
  selectedCode: string;
  filePath: string;
}

export interface IdeMultiEditResponse {
  summary: string;
  edits: IdeFileEdit[];
}

export interface IdeSearchResult {
  filePath: string;
  lineNumber: number;
  symbolName: string;
  symbolType: string;
  snippet: string;
  score: number;
}

export interface IdeSearchResponse {
  results: IdeSearchResult[];
  aiSummary: string;
}

export interface IdeAgentStep {
  step: number;
  title: string;
  detail: string;
}

export interface IdeAgentResponse {
  runId: number;
  steps: IdeAgentStep[];
  result: string;
  edits: IdeFileEdit[];
}

export interface GitConnection {
  id: number;
  projectId: number;
  provider: string;
  remoteUrl: string;
  branch: string;
  username: string;
  connected: boolean;
  lastSyncAt: string;
}

export interface GitConnectRequest {
  projectId: number;
  provider: string;
  remoteUrl: string;
  branch: string;
  username: string;
  accessToken: string;
}

export interface GitSyncResponse {
  success: boolean;
  message: string;
  commitMessage?: string;
}
