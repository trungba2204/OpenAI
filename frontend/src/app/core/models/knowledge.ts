export type KnowledgeStatus = 'DRAFT' | 'READY' | 'ARCHIVED';
export type KnowledgeDocumentStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export interface KnowledgeBase {
  id: number;
  name: string;
  description?: string;
  systemPrompt?: string;
  persona?: string;
  status: KnowledgeStatus;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBaseRequest {
  name: string;
  description?: string;
  systemPrompt?: string;
  persona?: string;
}

export interface KnowledgeDocument {
  id: number;
  knowledgeBaseId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  status: KnowledgeDocumentStatus;
  errorMessage?: string;
  uploadedAt: string;
}

export interface KnowledgeChatRequest {
  message: string;
  sessionId?: number | null;
}

export interface KnowledgeChatResponse {
  answer: string;
  sources: string[];
  sessionId: number;
}

export interface KnowledgeChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  createdAt: string;
}
