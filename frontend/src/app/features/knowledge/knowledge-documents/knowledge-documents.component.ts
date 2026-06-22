import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KnowledgeDetailShellComponent } from '../knowledge-detail-shell/knowledge-detail-shell.component';
import { KnowledgeDocumentService } from '../../../core/services/knowledge-document.service';
import { KnowledgeDocument } from '../../../core/models/knowledge';

@Component({
  selector: 'app-knowledge-documents',
  imports: [KnowledgeDetailShellComponent],
  template: `
    @if (kbId()) {
      <app-knowledge-detail-shell [kbId]="kbId()!">
        <div class="feature-dropzone" (dragover)="onDragOver($event)" (drop)="onDrop($event)">
          <p>Kéo thả tài liệu hoặc</p>
          <label class="feature-btn feature-btn--primary feature-btn--sm">
            Chọn file
            <input type="file" multiple hidden (change)="onFileSelect($event)"
              accept=".pdf,.docx,.txt,.md,.csv,.xlsx" />
          </label>
          <p style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.5rem">
            PDF, DOCX, TXT, Markdown, CSV, Excel
          </p>
        </div>

        @if (uploading()) {
          <p class="feature-empty">Đang upload...</p>
        }

        @if (documents().length === 0 && !loading()) {
          <p class="feature-empty">Chưa có tài liệu. Upload để AI học dữ liệu.</p>
        } @else {
          <ul class="feature-list" style="margin-top:1rem">
            @for (doc of documents(); track doc.id) {
              <li class="feature-list-item">
                <div>
                  <strong>{{ doc.fileName }}</strong>
                  <span style="margin-left:0.5rem;font-size:0.75rem;color:var(--text-secondary)">
                    {{ statusLabel(doc.status) }}
                  </span>
                  @if (doc.errorMessage) {
                    <p class="feature-alert" style="margin:0.25rem 0 0">{{ doc.errorMessage }}</p>
                  }
                </div>
                <button type="button" class="feature-btn feature-btn--sm" (click)="remove(doc)">Xóa</button>
              </li>
            }
          </ul>
        }
      </app-knowledge-detail-shell>
    }
  `
})
export class KnowledgeDocumentsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private docService = inject(KnowledgeDocumentService);

  kbId = signal<number | null>(null);
  documents = signal<KnowledgeDocument[]>([]);
  loading = signal(true);
  uploading = signal(false);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.kbId.set(id);
      this.load();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  load(): void {
    const id = this.kbId();
    if (!id) return;
    this.docService.list(id).subscribe({
      next: docs => {
        this.documents.set(docs);
        this.loading.set(false);
        if (docs.some(d => d.status === 'PROCESSING' || d.status === 'UPLOADED')) {
          this.startPolling();
        } else {
          this.stopPolling();
        }
      },
      error: () => this.loading.set(false)
    });
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files) this.uploadFiles(Array.from(files));
  }

  onFileSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files) this.uploadFiles(Array.from(input.files));
    input.value = '';
  }

  uploadFiles(files: File[]): void {
    const id = this.kbId();
    if (!id || files.length === 0) return;
    this.uploading.set(true);
    let done = 0;
    files.forEach(file => {
      this.docService.upload(id, file).subscribe({
        next: () => {
          done++;
          if (done === files.length) {
            this.uploading.set(false);
            this.load();
          }
        },
        error: () => {
          done++;
          if (done === files.length) {
            this.uploading.set(false);
            this.load();
          }
        }
      });
    });
  }

  remove(doc: KnowledgeDocument): void {
    const id = this.kbId();
    if (!id || !confirm(`Xóa "${doc.fileName}"?`)) return;
    this.docService.delete(id, doc.id).subscribe(() => this.load());
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      UPLOADED: '⏳ Chờ xử lý',
      PROCESSING: '⚙️ Đang xử lý',
      READY: '✅ Sẵn sàng',
      FAILED: '❌ Lỗi'
    };
    return map[status] || status;
  }

  private startPolling(): void {
    if (this.pollTimer) return;
    this.pollTimer = setInterval(() => this.load(), 3000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
