import { Component, input, output, effect, ElementRef, viewChild, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { MessageActionsComponent } from '../message-actions/message-actions.component';
import { MessageAttachmentComponent } from '../message-attachment/message-attachment.component';
import { Message, MessageAttachment } from '../../../core/models';

@Component({
  selector: 'app-message-list',
  imports: [MessageActionsComponent, MessageAttachmentComponent],
  host: {
    class: 'chat-message-list-host'
  },
  template: `
    <div class="chat-messages" #scrollContainer>
      @if (messages().length === 0 && !streaming()) {
        <div class="chat-empty chat-empty--enter">
          <div class="emoji">✨</div>
          <h2>Bạn cần giúp gì hôm nay?</h2>
          <p>Hỏi bất cứ điều gì — viết code, phân tích tài liệu, tạo nội dung, brainstorm ý tưởng...</p>
        </div>
      } @else {
        <div class="chat-messages__inner">
          @for (msg of messages(); track trackMessage($index, msg); let i = $index) {
            <div class="chat-msg chat-msg--enter" [class.user]="msg.role === 'user'">
              <div class="chat-msg__avatar" [class.assistant]="msg.role === 'assistant'" [class.user]="msg.role === 'user'">
                {{ msg.role === 'user' ? '👤' : '🤖' }}
              </div>
              <div class="chat-msg__column" [class.user]="msg.role === 'user'">
                <div class="chat-msg__body" [class.user]="msg.role === 'user'">
                  @if (msg.role === 'assistant') {
                    <div class="markdown-body" [innerHTML]="renderMarkdown(msg.content)"></div>
                  } @else {
                    @if (resolveAttachment(msg); as attachment) {
                      <app-message-attachment [attachment]="attachment" />
                    }
                    @if (msg.content) {
                      <p [class.chat-msg__text-after-file]="!!resolveAttachment(msg)">{{ msg.content }}</p>
                    }
                  }
                </div>
                @if (msg.role === 'assistant' && !streaming()) {
                  <app-message-actions
                    [content]="msg.content"
                    (regenerate)="regenerateMessage.emit(i)" />
                }
              </div>
            </div>
          }

          @if (streaming()) {
            <div class="chat-msg chat-msg--streaming chat-msg--enter">
              <div class="chat-msg__avatar assistant chat-msg__avatar--loading">🤖</div>
              <div class="chat-msg__column">
                <div class="chat-msg__body chat-msg__body--streaming">
                  @if (streamContent()) {
                    <div class="chat-streaming-wrap">
                      <div class="chat-streaming-shimmer" aria-hidden="true"></div>
                      <div
                        class="markdown-body chat-streaming-text"
                        [class.chat-streaming-text--pulse-a]="streamRevision() % 2 === 0"
                        [class.chat-streaming-text--pulse-b]="streamRevision() % 2 === 1"
                        [innerHTML]="renderMarkdown(streamContent())">
                      </div>
                      <span class="chat-streaming-cursor" aria-hidden="true"></span>
                    </div>
                  } @else {
                    <div class="chat-ai-loading" aria-label="AI đang trả lời" role="status">
                      <span class="chat-typing-dots" aria-hidden="true">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                      <span class="chat-ai-loading__label">Đang suy nghĩ...</span>
                    </div>
                  }
                </div>
              </div>
            </div>
          }
          <div #scrollAnchor class="chat-messages__anchor" aria-hidden="true"></div>
        </div>
      }
    </div>
  `
})
export class MessageListComponent {
  messages = input<Message[]>([]);
  streaming = input(false);
  streamContent = input('');

  regenerateMessage = output<number>();

  streamRevision = signal(0);

  private scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');
  private scrollAnchor = viewChild<ElementRef<HTMLElement>>('scrollAnchor');
  private lastStreamLength = 0;

  constructor(private sanitizer: DomSanitizer) {
    effect(() => {
      const content = this.streamContent();
      const isStreaming = this.streaming();

      if (isStreaming && content.length > this.lastStreamLength) {
        this.streamRevision.update(n => n + 1);
      }
      this.lastStreamLength = isStreaming ? content.length : 0;

      this.messages();
      this.scheduleScrollToBottom();
    });
  }

  trackMessage(index: number, msg: Message): string | number {
    return msg.id ?? `${msg.role}-${index}-${msg.content.length}-${msg.attachment?.filename ?? ''}`;
  }

  renderMarkdown(content: string): SafeHtml {
    const html = marked.parse(content || '', { async: false }) as string;
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  resolveAttachment(msg: Message): MessageAttachment | undefined {
    if (msg.attachment) {
      return msg.attachment;
    }
    if (msg.attachmentFilename) {
      return {
        filename: msg.attachmentFilename,
        mimeType: msg.attachmentMimeType,
        documentId: msg.attachmentDocumentId
      };
    }
    return undefined;
  }

  private scheduleScrollToBottom(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.scrollToBottom());
    });
  }

  private scrollToBottom(): void {
    const anchor = this.scrollAnchor()?.nativeElement;
    if (anchor) {
      anchor.scrollIntoView({ block: 'end', behavior: 'instant' });
      return;
    }
    const el = this.scrollContainer()?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }
}
