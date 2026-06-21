import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { GeneratorService } from '../../../core/services/generator.service';
import { DocumentService } from '../../../core/services/document.service';
import { DocumentItem } from '../../../core/models';

@Component({
  selector: 'app-markdown-generator',
  imports: [FormsModule, SidebarComponent],
  template: `
    <div class="feature-layout">
      <app-sidebar [conversations]="[]" [activeId]="null" (newChat)="goChat()" (selectConversation)="goChat()" />

      <main class="feature-main">
        <div class="feature-toolbar">
          <h1 class="feature-title">📝 Markdown Generator</h1>
        </div>

        <div class="feature-split">
          <div class="feature-split__panel feature-split__panel--border">
            <div class="feature-tabs">
              <button type="button" class="feature-tab" [class.feature-tab--active]="source === 'text'" (click)="source = 'text'">Text</button>
              <button type="button" class="feature-tab" [class.feature-tab--active]="source === 'document'" (click)="source = 'document'">Document</button>
            </div>

            @if (source === 'text') {
              <textarea [(ngModel)]="inputText" placeholder="Nhập requirement..." class="feature-textarea feature-textarea--grow"></textarea>
            } @else {
              <select [(ngModel)]="selectedDocId" class="feature-select">
                <option [ngValue]="null">Chọn document...</option>
                @for (d of documents(); track d.id) {
                  <option [ngValue]="d.id">{{ d.filename }}</option>
                }
              </select>
            }

            <div class="feature-actions">
              <button type="button" (click)="generate()" [disabled]="loading()" class="feature-btn feature-btn--primary">
                {{ loading() ? 'Đang sinh...' : 'Generate Markdown' }}
              </button>
            </div>
          </div>

          <div class="feature-split__panel">
            <div class="feature-preview-actions">
              <button type="button" (click)="copyMd()" [disabled]="!preview()" class="feature-btn feature-btn--sm">Copy</button>
              <button type="button" (click)="downloadMd()" [disabled]="!generatedId()" class="feature-btn feature-btn--primary feature-btn--sm">Download .md</button>
            </div>
            <div class="markdown-body" [innerHTML]="renderMarkdown(preview())"></div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class MarkdownGeneratorComponent {
  private generator = inject(GeneratorService);
  private documentService = inject(DocumentService);
  private sanitizer = inject(DomSanitizer);

  source: 'text' | 'document' = 'text';
  inputText = '';
  selectedDocId: number | null = null;
  documents = signal<DocumentItem[]>([]);
  preview = signal('');
  generatedId = signal<number | null>(null);
  loading = signal(false);

  constructor() {
    this.documentService.list().subscribe(d => this.documents.set(d));
  }

  generate(): void {
    this.loading.set(true);
    this.generator.generateMarkdown(
      this.source,
      this.source === 'text' ? this.inputText : undefined,
      this.source === 'document' ? this.selectedDocId ?? undefined : undefined
    ).subscribe({
      next: res => {
        this.generatedId.set(res.id);
        this.generator.downloadMarkdown(res.id).subscribe(blob => {
          blob.text().then(text => this.preview.set(text));
          this.loading.set(false);
        });
      },
      error: () => this.loading.set(false)
    });
  }

  copyMd(): void {
    navigator.clipboard.writeText(this.preview());
  }

  downloadMd(): void {
    const id = this.generatedId();
    if (!id) return;
    this.generator.downloadMarkdown(id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'document.md';
      a.click();
    });
  }

  renderMarkdown(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(marked.parse(content || '', { async: false }) as string);
  }

  goChat(): void { window.location.href = '/chat'; }
}
