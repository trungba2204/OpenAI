import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { GeneratorService } from '../../../core/services/generator.service';

@Component({
  selector: 'app-ppt-generator',
  imports: [FormsModule, SidebarComponent],
  template: `
    <div class="feature-layout">
      <app-sidebar [conversations]="[]" [activeId]="null" (newChat)="goChat()" (selectConversation)="goChat()" />

      <main class="feature-main feature-main--scroll">
        <div class="feature-container feature-container--narrow">
          <h1 class="feature-title">📊 PPT Generator</h1>
          <p class="feature-desc">Dán Markdown hoặc requirement để sinh PowerPoint</p>

          <textarea [(ngModel)]="input" placeholder="Dán Markdown hoặc mô tả presentation..."
            class="feature-textarea feature-textarea--lg"></textarea>

          <div class="feature-actions">
            <button type="button" (click)="generate()" [disabled]="loading() || !input.trim()"
              class="feature-btn feature-btn--primary feature-btn--lg">
              {{ loading() ? 'Đang tạo PPT...' : 'Generate PowerPoint' }}
            </button>
          </div>

          @if (generatedId()) {
            <div class="feature-success">
              <p>✅ PPT đã sẵn sàng!</p>
              <button type="button" (click)="download()" class="feature-btn feature-btn--primary feature-btn--sm">
                Download .pptx
              </button>
            </div>
          }
        </div>
      </main>
    </div>
  `
})
export class PptGeneratorComponent {
  private generator = inject(GeneratorService);

  input = '';
  generatedId = signal<number | null>(null);
  loading = signal(false);

  generate(): void {
    this.loading.set(true);
    const isMarkdown = this.input.includes('#') || this.input.includes('- ');
    this.generator.generatePpt(
      isMarkdown ? this.input : undefined,
      isMarkdown ? undefined : this.input
    ).subscribe({
      next: res => { this.generatedId.set(res.id); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  download(): void {
    const id = this.generatedId();
    if (!id) return;
    this.generator.downloadPpt(id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'presentation.pptx';
      a.click();
    });
  }

  goChat(): void { window.location.href = '/chat'; }
}
