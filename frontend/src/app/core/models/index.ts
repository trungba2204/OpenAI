export type AiModel =
  | 'GROQ_LLAMA_8B'
  | 'GROQ_LLAMA_70B'
  | 'GROQ_GEMMA'
  | 'GEMINI_FLASH_LITE'
  | 'GEMINI_FLASH'
  | 'GEMINI_15_FLASH'
  | 'OR_LLAMA_8B_FREE'
  | 'OR_GEMINI_FLASH_LITE_FREE'
  | 'OR_QWEN_FREE'
  | 'OR_DEEPSEEK_CHAT'
  | 'OR_GPT4O_MINI';

export interface AiModelInfo {
  id: AiModel;
  modelId: string;
  displayName: string;
}

export interface Conversation {
  id: number;
  title: string;
  model: AiModel;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  documentId?: number;
  filename: string;
  mimeType?: string;
}

export interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  attachment?: MessageAttachment;
  attachmentFilename?: string;
  attachmentMimeType?: string;
  attachmentDocumentId?: number;
  createdAt?: string;
}

export interface PromptTemplate {
  id: number;
  title: string;
  content: string;
  category: string;
  isPublic: boolean;
  owned: boolean;
  createdAt: string;
}

export interface DocumentItem {
  id: number;
  filename: string;
  mimeType: string;
  extractedTextPreview?: string;
  createdAt: string;
}

export interface AgentRun {
  id: number;
  toolName: string;
  input: string;
  output: string;
  createdAt: string;
}
