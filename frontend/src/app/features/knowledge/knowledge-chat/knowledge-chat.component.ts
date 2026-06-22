import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { KnowledgeDetailShellComponent } from '../knowledge-detail-shell/knowledge-detail-shell.component';
import { KnowledgeChatService } from '../../../core/services/knowledge-chat.service';

interface ChatBubble {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

@Component({
  selector: 'app-knowledge-chat',
  imports: [FormsModule, KnowledgeDetailShellComponent],
  template: `
    @if (kbId()) {
      <app-knowledge-detail-shell [kbId]="kbId()!">
        <div class="knowledge-chat">
          <div class="knowledge-chat__messages">
            @if (messages().length === 0) {
              <p class="feature-empty">Hỏi AI dựa trên tài liệu đã upload</p>
            }
            @for (msg of messages(); track $index) {
              <div class="knowledge-chat__bubble knowledge-chat__bubble--{{ msg.role }}">
                <div>{{ msg.content }}</div>
                @if (msg.sources?.length) {
                  <div class="knowledge-chat__sources">
                    <strong>Nguồn:</strong> {{ msg.sources!.join(', ') }}
                  </div>
                }
              </div>
            }
            @if (thinking()) {
              <div class="knowledge-chat__bubble knowledge-chat__bubble--assistant">Đang suy nghĩ...</div>
            }
          </div>
          <div class="knowledge-chat__input-row">
            <input
              class="feature-input"
              style="flex:1"
              [(ngModel)]="input"
              placeholder="Câu hỏi của bạn..."
              (keydown.enter)="send()"
              [disabled]="thinking()" />
            <button type="button" class="feature-btn feature-btn--primary" [disabled]="thinking() || !input.trim()" (click)="send()">
              Gửi
            </button>
          </div>
        </div>
      </app-knowledge-detail-shell>
    }
  `
})
export class KnowledgeChatComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private chatService = inject(KnowledgeChatService);

  kbId = signal<number | null>(null);
  messages = signal<ChatBubble[]>([]);
  sessionId = signal<number | null>(null);
  thinking = signal(false);
  input = '';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.kbId.set(id);
  }

  send(): void {
    const text = this.input.trim();
    const id = this.kbId();
    if (!text || !id || this.thinking()) return;

    this.messages.update(m => [...m, { role: 'user', content: text }]);
    this.input = '';
    this.thinking.set(true);

    this.chatService.chat(id, { message: text, sessionId: this.sessionId() }).subscribe({
      next: res => {
        this.sessionId.set(res.sessionId);
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: res.answer,
          sources: res.sources
        }]);
        this.thinking.set(false);
      },
      error: err => {
        this.messages.update(m => [...m, {
          role: 'assistant',
          content: err?.error?.message || 'Không thể gửi tin nhắn'
        }]);
        this.thinking.set(false);
      }
    });
  }
}
