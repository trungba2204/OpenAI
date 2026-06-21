import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiModel, AiModelInfo, Conversation, Message, MessageAttachment } from '../models';
import { AuthService } from './auth.service';

const DEFAULT_MODELS: AiModelInfo[] = [
  { id: 'GROQ_LLAMA_8B', modelId: 'llama-3.1-8b-instant', displayName: 'Llama 3.1 8B (Free)' },
  { id: 'GROQ_LLAMA_70B', modelId: 'llama-3.3-70b-versatile', displayName: 'Llama 3.3 70B (Free)' },
  { id: 'GROQ_GEMMA', modelId: 'gemma2-9b-it', displayName: 'Gemma 2 9B (Free)' },
  { id: 'GEMINI_FLASH_LITE', modelId: 'gemini-2.0-flash-lite', displayName: 'Gemini 2.0 Flash Lite' },
  { id: 'GEMINI_FLASH', modelId: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash' },
  { id: 'GEMINI_15_FLASH', modelId: 'gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
  { id: 'OR_LLAMA_8B_FREE', modelId: 'meta-llama/llama-3.1-8b-instruct:free', displayName: 'OR Llama 3.1 8B (Free)' },
  { id: 'OR_GEMINI_FLASH_LITE_FREE', modelId: 'google/gemini-2.0-flash-lite-preview-02-05:free', displayName: 'OR Gemini 2.0 Flash Lite (Free)' },
  { id: 'OR_QWEN_FREE', modelId: 'qwen/qwen-2.5-7b-instruct:free', displayName: 'OR Qwen 2.5 7B (Free)' },
  { id: 'OR_DEEPSEEK_CHAT', modelId: 'deepseek/deepseek-chat', displayName: 'OR DeepSeek Chat' },
  { id: 'OR_GPT4O_MINI', modelId: 'openai/gpt-4o-mini', displayName: 'OR GPT-4o Mini' },
];

@Injectable({ providedIn: 'root' })
export class ChatService {
  private auth = inject(AuthService);

  selectedModel = signal<AiModel>('GROQ_LLAMA_8B');
  agentMode = signal(false);
  pendingPrompt = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  getModels(): Observable<AiModelInfo[]> {
    return this.http.get<AiModelInfo[]>(`${environment.apiUrl}/models`);
  }

  getDefaultModels(): AiModelInfo[] {
    return DEFAULT_MODELS;
  }

  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${environment.apiUrl}/conversations`);
  }

  createConversation(model?: AiModel): Observable<Conversation> {
    return this.http.post<Conversation>(`${environment.apiUrl}/conversations`, { model });
  }

  getMessages(conversationId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${environment.apiUrl}/conversations/${conversationId}/messages`).pipe(
      map(messages => messages.map(m => this.normalizeMessage(m)))
    );
  }

  private normalizeMessage(message: Message): Message {
    const attachment = message.attachment ?? (
      message.attachmentFilename
        ? {
            filename: message.attachmentFilename,
            mimeType: message.attachmentMimeType,
            documentId: message.attachmentDocumentId
          }
        : undefined
    );

    return {
      ...message,
      attachment,
      attachmentFilename: undefined,
      attachmentMimeType: undefined,
      attachmentDocumentId: undefined
    };
  }

  deleteConversation(conversationId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/conversations/${conversationId}`);
  }

  sendMessage(conversationId: number | null, content: string, model: AiModel): Observable<Message> {
    return this.http.post<Message>(`${environment.apiUrl}/chat`, {
      conversationId, content, model
    });
  }

  streamMessage(
    conversationId: number | null,
    content: string,
    model: AiModel,
    attachment?: MessageAttachment,
    displayContent?: string
  ): Observable<string> {
    return new Observable(observer => {
      const run = async (retried = false) => {
        const token = this.auth.getAccessToken();
        if (!token) {
          observer.error('Chưa đăng nhập');
          return;
        }

        try {
          const body: Record<string, unknown> = { conversationId, content, model };
          if (displayContent?.trim()) {
            body['displayContent'] = displayContent.trim();
          }
          if (attachment?.documentId) {
            body['attachmentDocumentId'] = attachment.documentId;
          }
          if (attachment?.filename) {
            body['attachmentFilename'] = attachment.filename;
          }
          if (attachment?.mimeType) {
            body['attachmentMimeType'] = attachment.mimeType;
          }

          const response = await fetch(`${environment.apiUrl}/chat/stream`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
          });

          if ((response.status === 401 || response.status === 403) && !retried && this.auth.getRefreshToken()) {
            await firstValueFrom(this.auth.refreshToken());
            return run(true);
          }

          if (!response.ok) {
            observer.error(await response.text());
            return;
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          if (!reader) {
            observer.complete();
            return;
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            observer.next(decoder.decode(value, { stream: true }));
          }
          observer.complete();
        } catch (err) {
          observer.error(err);
        }
      };

      run();
    });
  }

  agentChat(conversationId: number | null, content: string, model: AiModel): Observable<{ content: string }> {
    return this.http.post<{ content: string }>(`${environment.apiUrl}/agent/chat`, {
      conversationId, content, model
    });
  }
}
