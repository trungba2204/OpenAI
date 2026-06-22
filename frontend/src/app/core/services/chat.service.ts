import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiModel, AiModelInfo, Conversation, Message, MessageAttachment } from '../models';
import { AuthService } from './auth.service';

const UI_MODELS: AiModel[] = [
  'GROQ_LLAMA_70B',
  'OR_DEEPSEEK_CHAT',
  'OR_GPT4O_MINI',
];

const DEFAULT_MODELS: AiModelInfo[] = [
  { id: 'GROQ_LLAMA_70B', modelId: 'llama-3.3-70b-versatile', displayName: 'Llama 3.3 70B (Free)' },
  { id: 'OR_DEEPSEEK_CHAT', modelId: 'deepseek/deepseek-chat', displayName: 'OR DeepSeek Chat' },
  { id: 'OR_GPT4O_MINI', modelId: 'openai/gpt-4o-mini', displayName: 'OR GPT-4o Mini' },
];

function isGeminiModel(model: { id: string; modelId: string; displayName: string }): boolean {
  const text = `${model.id} ${model.modelId} ${model.displayName}`.toLowerCase();
  return text.includes('gemini');
}

function filterUiModels(models: AiModelInfo[]): AiModelInfo[] {
  const allowed = new Set<string>(UI_MODELS);
  return models.filter(model => allowed.has(model.id) && !isGeminiModel(model));
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private auth = inject(AuthService);

  selectedModel = signal<AiModel>('GROQ_LLAMA_70B');
  selectedKnowledgeBaseId = signal<number | null>(null);
  pendingPrompt = signal<string | null>(null);

  constructor(private http: HttpClient) {}

  getModels(): Observable<AiModelInfo[]> {
    return this.http.get<AiModelInfo[]>(`${environment.apiUrl}/models`).pipe(
      map(models => {
        const filtered = filterUiModels(models);
        return filtered.length ? filtered : this.getDefaultModels();
      })
    );
  }

  getDefaultModels(): AiModelInfo[] {
    return filterUiModels(DEFAULT_MODELS);
  }

  sanitizeModel(model: string | null | undefined): AiModel {
    const fallback: AiModel = 'GROQ_LLAMA_70B';
    if (!model || isGeminiModel({ id: model, modelId: model, displayName: model })) {
      return fallback;
    }
    return UI_MODELS.includes(model as AiModel) ? model as AiModel : fallback;
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
          const knowledgeBaseId = this.selectedKnowledgeBaseId();
          if (knowledgeBaseId != null) {
            body['knowledgeBaseId'] = knowledgeBaseId;
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
}
