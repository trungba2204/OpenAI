import { Component, inject, OnInit, signal, computed, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { switchMap, of, map } from 'rxjs';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent, ChatSendPayload } from '../message-input/message-input.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ChatService } from '../../../core/services/chat.service';
import { DocumentService } from '../../../core/services/document.service';
import { PromptService } from '../../../core/services/prompt.service';
import { KnowledgeBaseService } from '../../../core/services/knowledge-base.service';
import { AiModel, AiModelInfo, Conversation, Message, MessageAttachment, PromptTemplate, KnowledgeBase } from '../../../core/models';

@Component({
  selector: 'app-chat-page',
  imports: [FormsModule, SidebarComponent, MessageListComponent, MessageInputComponent, ConfirmDialogComponent],
  template: `
    <div class="chat-layout">
      <app-sidebar
        [conversations]="conversations()"
        [activeId]="activeConversationId()"
        (newChat)="newChat()"
        (selectConversation)="loadConversation($event)"
        (deleteConversation)="openDeleteDialog($event)" />

      <main class="chat-main">
        <header class="chat-header">
          <select class="chat-select" (change)="onPromptSelect($event)">
            <option value="">📚 Prompt...</option>
            @for (p of prompts(); track p.id) {
              <option [value]="p.id">{{ p.title }}</option>
            }
          </select>

          <select
            class="chat-select"
            [class.chat-select--active]="selectedKnowledgeBaseId() !== null"
            [ngModel]="selectedKnowledgeBaseId()"
            (ngModelChange)="onKnowledgeSelect($event)">
            <option [ngValue]="null">🧠 Knowledge...</option>
            @for (kb of knowledgeBases(); track kb.id) {
              <option [ngValue]="kb.id">{{ kb.name }} ({{ kb.documentCount }} tài liệu)</option>
            }
          </select>

          @if (selectedKnowledgeBaseId() !== null) {
            <span class="chat-header__kb-badge">RAG bật</span>
          }
        </header>

        <div class="chat-content">
          <app-message-list
            [messages]="messages()"
            [streaming]="streaming()"
            [streamContent]="streamContent()"
            (regenerateMessage)="regenerateAt($event)" />
        </div>

        <app-message-input
          [disabled]="streaming()"
          [initialText]="chatService.pendingPrompt()"
          [models]="models()"
          [(selectedModel)]="selectedModel"
          (selectedModelChange)="onModelChange()"
          (sendMessage)="send($event)" />
      </main>
    </div>

    <app-confirm-dialog
      [open]="deleteDialogOpen()"
      [title]="deleteDialogTitle()"
      [message]="deleteDialogMessage()"
      [error]="deleteError()"
      confirmLabel="Xóa"
      cancelLabel="Hủy"
      (confirm)="confirmDelete()"
      (cancel)="closeDeleteDialog()" />
  `
})
export class ChatPageComponent implements OnInit {
  chatService = inject(ChatService);
  private documentService = inject(DocumentService);
  private promptService = inject(PromptService);
  private knowledgeBaseService = inject(KnowledgeBaseService);

  private messageInput = viewChild(MessageInputComponent);

  conversations = signal<Conversation[]>([]);
  messages = signal<Message[]>([]);
  models = signal<AiModelInfo[]>([]);
  prompts = signal<PromptTemplate[]>([]);
  knowledgeBases = signal<KnowledgeBase[]>([]);
  selectedKnowledgeBaseId = signal<number | null>(null);
  activeConversationId = signal<number | null>(null);
  streaming = signal(false);
  streamContent = signal('');
  selectedModel: AiModel = 'GROQ_LLAMA_70B';
  deleteDialogOpen = signal(false);
  deleteTargetId = signal<number | null>(null);
  deleteError = signal<string | null>(null);

  deleteDialogTitle = computed(() =>
    this.deleteError() ? 'Không thể xóa' : 'Xóa cuộc trò chuyện'
  );

  deleteDialogMessage = computed(() => {
    if (this.deleteError()) {
      return this.deleteError()!;
    }
    const id = this.deleteTargetId();
    const conv = this.conversations().find(c => c.id === id);
    const title = conv?.title?.trim();
    if (title) {
      return `Bạn có chắc muốn xóa "${title}"? Hành động này không thể hoàn tác.`;
    }
    return 'Bạn có chắc muốn xóa cuộc trò chuyện này? Hành động này không thể hoàn tác.';
  });

  onModelChange(): void {
    this.chatService.selectedModel.set(this.selectedModel);
  }

  ngOnInit(): void {
    this.chatService.getModels().subscribe({
      next: m => this.models.set(m),
      error: () => this.models.set(this.chatService.getDefaultModels())
    });
    this.promptService.list().subscribe(p => this.prompts.set(p));
    this.knowledgeBaseService.list().subscribe({
      next: list => this.knowledgeBases.set(list),
      error: () => this.knowledgeBases.set([])
    });
    this.loadConversations();
    this.selectedModel = this.chatService.sanitizeModel(this.chatService.selectedModel());
    this.chatService.selectedModel.set(this.selectedModel);
    this.selectedKnowledgeBaseId.set(this.chatService.selectedKnowledgeBaseId());
  }

  loadConversations(): void {
    this.chatService.getConversations().subscribe(c => this.conversations.set(c));
  }

  newChat(): void {
    this.activeConversationId.set(null);
    this.messages.set([]);
    this.streamContent.set('');
  }

  loadConversation(id: number): void {
    this.activeConversationId.set(id);
    const conv = this.conversations().find(c => c.id === id);
    if (conv) {
      this.selectedModel = this.chatService.sanitizeModel(conv.model);
      this.chatService.selectedModel.set(this.selectedModel);
    }
    this.chatService.getMessages(id).subscribe(msgs => this.messages.set(msgs));
  }

  openDeleteDialog(id: number): void {
    this.deleteTargetId.set(id);
    this.deleteError.set(null);
    this.deleteDialogOpen.set(true);
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.deleteTargetId.set(null);
    this.deleteError.set(null);
  }

  confirmDelete(): void {
    const id = this.deleteTargetId();
    if (!id || this.deleteError()) {
      this.closeDeleteDialog();
      return;
    }

    this.chatService.deleteConversation(id).subscribe({
      next: () => {
        if (this.activeConversationId() === id) {
          this.newChat();
        }
        this.loadConversations();
        this.closeDeleteDialog();
      },
      error: () => {
        this.deleteError.set('Không xóa được cuộc trò chuyện. Vui lòng thử lại.');
      }
    });
  }

  send(payload: ChatSendPayload): void {
    if (this.streaming()) return;
    this.chatService.pendingPrompt.set(null);

    const text = payload.text.trim();
    const file = payload.file;
    if (!text && !file) return;

    const messageText = text || 'Phân tích tài liệu đính kèm và trả lời bằng tiếng Việt.';
    const attachment: MessageAttachment | undefined = file
      ? { filename: file.name, mimeType: file.type || undefined }
      : undefined;

    this.messages.update(msgs => [...msgs, {
      role: 'user',
      content: text,
      attachment
    }]);

    if (file) {
      this.ensureConversationId().pipe(
        switchMap(convId => {
          this.activeConversationId.set(convId);
          return this.documentService.upload(file, convId);
        })
      ).subscribe({
        next: doc => {
          this.messages.update(msgs => {
            const updated = [...msgs];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'user' && updated[i].attachment) {
                updated[i] = {
                  ...updated[i],
                  attachment: {
                    ...updated[i].attachment!,
                    documentId: doc.id
                  }
                };
                break;
              }
            }
            return updated;
          });
          this.streamReply(messageText, {
            filename: file.name,
            mimeType: file.type || undefined,
            documentId: doc.id
          }, text);
        },
        error: () => {
          this.messages.update(msgs => [...msgs, {
            role: 'assistant',
            content: `⚠️ Không upload được file **${file.name}**. Hãy dùng PDF, DOCX, TXT hoặc XLSX.`
          }]);
        }
      });
      return;
    }

    this.streamReply(messageText);
  }

  private ensureConversationId() {
    const existing = this.activeConversationId();
    if (existing) {
      return of(existing);
    }
    return this.chatService.createConversation(this.selectedModel).pipe(
      map(c => c.id)
    );
  }

  regenerateAt(assistantIndex: number): void {
    if (this.streaming()) return;

    const msgs = this.messages();
    let userContent = '';
    for (let i = assistantIndex - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        userContent = msgs[i].content;
        break;
      }
    }
    if (!userContent) return;

    this.messages.set(msgs.slice(0, assistantIndex));
    this.streamReply(userContent);
  }

  private streamReply(content: string, attachment?: MessageAttachment, displayContent?: string): void {
    this.streaming.set(true);
    this.streamContent.set('');

    this.chatService.streamMessage(
      this.activeConversationId(),
      content,
      this.selectedModel,
      attachment,
      displayContent
    ).subscribe({
      next: chunk => this.streamContent.update(s => s + chunk),
      complete: () => {
        this.streaming.set(false);
        this.streamContent.set('');
        this.syncAfterSend();
      },
      error: (err) => {
        this.streaming.set(false);
        this.streamContent.set('');
        const body = typeof err === 'string' ? err : '';
        const isRateLimit = body.includes('429') || body.toLowerCase().includes('too many');
        this.messages.update(msgs => [...msgs, {
          role: 'assistant',
          content: isRateLimit
            ? '⚠️ **Vượt giới hạn API free (429)** — đợi 1–2 phút rồi thử lại.'
            : '⚠️ Không gửi được tin nhắn. Kiểm tra API key trong `application-local.yml` hoặc đăng nhập lại.'
        }]);
      }
    });
  }

  private syncAfterSend(): void {
    this.chatService.getConversations().subscribe(conversations => {
      this.conversations.set(conversations);
      const convId = this.activeConversationId() ?? conversations[0]?.id ?? null;
      if (convId) {
        this.activeConversationId.set(convId);
        const localSnapshot = this.messages();
        this.chatService.getMessages(convId).subscribe(msgs =>
          this.messages.set(this.mergeAttachments(localSnapshot, msgs))
        );
      }
    });
  }

  private mergeAttachments(local: Message[], server: Message[]): Message[] {
    const localWithFiles = local.filter(m => m.role === 'user' && m.attachment);

    return server.map(serverMsg => {
      if (serverMsg.attachment || serverMsg.role !== 'user') {
        return serverMsg;
      }

      const matched = localWithFiles.find(m => m.content === serverMsg.content) ?? localWithFiles[0];
      return matched?.attachment ? { ...serverMsg, attachment: matched.attachment } : serverMsg;
    });
  }

  onPromptSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const id = Number(select.value);
    select.value = '';
    if (!id) return;

    const prompt = this.prompts().find(p => p.id === id);
    if (!prompt) return;

    this.messageInput()?.applyText(prompt.content);
    this.chatService.pendingPrompt.set(null);
  }

  onKnowledgeSelect(id: number | null): void {
    this.selectedKnowledgeBaseId.set(id);
    this.chatService.selectedKnowledgeBaseId.set(id);
  }
}
