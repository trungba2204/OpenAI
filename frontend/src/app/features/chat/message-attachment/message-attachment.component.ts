import { Component, input, computed } from '@angular/core';
import { MessageAttachment } from '../../../core/models';

@Component({
  selector: 'app-message-attachment',
  template: `
    <div class="chat-msg-attachment">
      <span class="chat-msg-attachment__icon">{{ fileIcon() }}</span>
      <div class="chat-msg-attachment__meta">
        <span class="chat-msg-attachment__name">{{ attachment().filename }}</span>
        <span class="chat-msg-attachment__type">{{ typeLabel() }}</span>
      </div>
    </div>
  `
})
export class MessageAttachmentComponent {
  attachment = input.required<MessageAttachment>();

  fileIcon = computed(() => {
    const mime = this.attachment().mimeType ?? '';
    const name = this.attachment().filename.toLowerCase();
    if (mime.includes('pdf') || name.endsWith('.pdf')) return '📕';
    if (mime.includes('word') || name.endsWith('.docx')) return '📘';
    if (mime.includes('sheet') || name.endsWith('.xlsx')) return '📗';
    if (mime.includes('text') || name.endsWith('.txt')) return '📄';
    return '📎';
  });

  typeLabel = computed(() => {
    const mime = this.attachment().mimeType ?? '';
    if (mime.includes('pdf')) return 'PDF';
    if (mime.includes('word')) return 'Word';
    if (mime.includes('sheet')) return 'Excel';
    if (mime.includes('text')) return 'Text';
    const ext = this.attachment().filename.split('.').pop();
    return ext ? ext.toUpperCase() : 'File';
  });
}
