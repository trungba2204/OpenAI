import { Component, input, output, effect, model, viewChild, ElementRef, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiModel, AiModelInfo } from '../../../core/models';

export interface ChatSendPayload {
  text: string;
  file: File | null;
}

@Component({
  selector: 'app-message-input',
  imports: [FormsModule],
  template: `
    <div class="chat-input-area">
      <div class="chat-input-area__inner">
        <div
          class="chat-input-card"
          [class.chat-input-card--dragover]="dragOver()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)">
          <input
            #fileInput
            type="file"
            class="chat-hidden-file"
            accept=".pdf,.docx,.txt,.xlsx"
            (change)="onFileSelected($event)" />

          @if (pendingFile()) {
            <div class="chat-input-attachments">
              <div class="chat-input-attachment">
                <span class="chat-input-attachment__icon">📎</span>
                <div class="chat-input-attachment__meta">
                  <span class="chat-input-attachment__name">{{ pendingFile()!.name }}</span>
                  <span class="chat-input-attachment__size">{{ formatFileSize(pendingFile()!.size) }}</span>
                </div>
                <button
                  type="button"
                  class="chat-input-attachment__remove"
                  (click)="removePendingFile()"
                  [disabled]="disabled()"
                  title="Gỡ file">
                  ✕
                </button>
              </div>
            </div>
          }

          <textarea
            #messageInput
            [(ngModel)]="text"
            (keydown)="onKeydown($event)"
            (keyup)="onKeyup($event)"
            (compositionstart)="onCompositionStart()"
            (compositionend)="onCompositionEnd($event)"
            [placeholder]="pendingFile() ? 'Thêm câu hỏi về tài liệu (tuỳ chọn)...' : placeholder()"
            [disabled]="disabled()"
            rows="1"
          ></textarea>

          <div class="chat-input-toolbar">
            <select
              class="chat-model-select"
              [ngModel]="selectedModel()"
              (ngModelChange)="onModelChange($event)"
              [disabled]="disabled()"
              title="Chọn model">
              @for (m of models(); track m.id) {
                <option [value]="m.id">{{ m.displayName }}</option>
              }
            </select>

            <button type="button" class="chat-input__attach" (click)="openFilePicker()" [disabled]="disabled()" title="Đính kèm file">
              📎
            </button>

            <div class="chat-input-toolbar__spacer"></div>

            <button
              type="button"
              class="chat-input__send"
              (click)="send()"
              [disabled]="(!text.trim() && !pendingFile()) || disabled()"
              title="Gửi">
              ➤
            </button>
          </div>
        </div>
        <p class="chat-input__hint">
          Enter gửi · Shift+Enter xuống dòng · Kéo thả file vào khung chat · Gửi mới phân tích file
        </p>
      </div>
    </div>
  `
})
export class MessageInputComponent {
  placeholder = input('Nhập tin nhắn...');
  disabled = input(false);
  initialText = input<string | null>(null);
  models = input<AiModelInfo[]>([]);
  selectedModel = model<AiModel>('GROQ_LLAMA_8B');

  sendMessage = output<ChatSendPayload>();

  private messageInput = viewChild<ElementRef<HTMLTextAreaElement>>('messageInput');
  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  text = '';
  pendingFile = signal<File | null>(null);
  dragOver = signal(false);

  private composing = false;
  private pendingEnterSend = false;

  constructor() {
    effect(() => {
      const init = this.initialText();
      if (init) {
        this.text = init;
        this.syncTextareaValue(init);
      }
    });
  }

  onModelChange(value: AiModel): void {
    this.selectedModel.set(value);
  }

  openFilePicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.pendingFile.set(file);
    }
    input.value = '';
  }

  removePendingFile(): void {
    this.pendingFile.set(null);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    if (this.disabled()) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.pendingFile.set(file);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  onCompositionStart(): void {
    this.composing = true;
    this.pendingEnterSend = false;
  }

  onCompositionEnd(event: CompositionEvent): void {
    this.composing = false;
    const target = event.target as HTMLTextAreaElement;
    this.text = target.value;
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key !== 'Enter' || e.shiftKey) return;

    if (this.composing || e.isComposing || e.keyCode === 229) {
      this.pendingEnterSend = false;
      return;
    }

    e.preventDefault();
    this.pendingEnterSend = true;
  }

  onKeyup(e: KeyboardEvent): void {
    if (e.key !== 'Enter' || e.shiftKey || !this.pendingEnterSend) return;
    this.pendingEnterSend = false;

    if (this.composing || e.isComposing) return;

    this.send();
  }

  send(): void {
    if (this.disabled()) return;

    const trimmed = this.readTextareaValue().trim();
    const file = this.pendingFile();
    if (!trimmed && !file) return;

    this.sendMessage.emit({ text: trimmed, file });
    this.text = '';
    this.pendingFile.set(null);
    this.syncTextareaValue('');
    this.pendingEnterSend = false;
  }

  private readTextareaValue(): string {
    return this.messageInput()?.nativeElement?.value ?? this.text;
  }

  private syncTextareaValue(value: string): void {
    const el = this.messageInput()?.nativeElement;
    if (el && el.value !== value) {
      el.value = value;
    }
  }
}
