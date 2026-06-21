import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { DocumentService } from '../../../core/services/document.service';
import { DocumentItem } from '../../../core/models';

@Component({
  selector: 'app-documents',
  imports: [DatePipe, SidebarComponent],
  template: `
    <div class="feature-layout">
      <app-sidebar [conversations]="[]" [activeId]="null" (newChat)="goChat()" (selectConversation)="goChat()" />

      <main class="feature-main feature-main--scroll">
        <div class="feature-container feature-container--narrow">
          <div class="feature-header">
            <h1 class="feature-title">📄 Documents</h1>
            <label class="feature-btn feature-btn--primary feature-btn-label">
              Upload file
              <input type="file" class="feature-hidden-input" accept=".pdf,.docx,.txt,.xlsx" (change)="onUpload($event)" />
            </label>
          </div>

          <div class="feature-dropzone"
            (dragover)="onDragOver($event)"
            (dragleave)="dragActive = false"
            (drop)="onDrop($event)"
            [class.feature-dropzone--active]="dragActive">
            <p>Kéo thả PDF, DOCX, TXT, XLSX vào đây</p>
          </div>

          @if (uploading()) {
            <div class="feature-alert">Đang upload...</div>
          }

          <div class="feature-list">
            @for (doc of documents(); track doc.id) {
              <div class="feature-list-item">
                <span class="feature-list-item__icon">📄</span>
                <div class="feature-list-item__content">
                  <p class="feature-list-item__title">{{ doc.filename }}</p>
                  <p class="feature-list-item__meta">{{ doc.mimeType }} · {{ doc.createdAt | date:'short' }}</p>
                  @if (doc.extractedTextPreview) {
                    <p class="feature-list-item__preview">{{ doc.extractedTextPreview }}</p>
                  }
                </div>
              </div>
            }
          </div>

          @if (documents().length === 0) {
            <p class="feature-empty">Chưa có tài liệu nào</p>
          }
        </div>
      </main>
    </div>
  `
})
export class DocumentsComponent implements OnInit {
  private documentService = inject(DocumentService);

  documents = signal<DocumentItem[]>([]);
  uploading = signal(false);
  dragActive = false;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.documentService.list().subscribe(d => this.documents.set(d));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = true;
  }

  onUpload(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.upload(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.upload(file);
  }

  upload(file: File): void {
    this.uploading.set(true);
    this.documentService.upload(file).subscribe({
      next: () => { this.load(); this.uploading.set(false); },
      error: () => this.uploading.set(false)
    });
  }

  goChat(): void { window.location.href = '/chat'; }
}
