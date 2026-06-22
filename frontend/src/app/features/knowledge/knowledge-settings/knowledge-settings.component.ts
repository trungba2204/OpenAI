import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { KnowledgeDetailShellComponent } from '../knowledge-detail-shell/knowledge-detail-shell.component';
import { KnowledgeBaseService } from '../../../core/services/knowledge-base.service';

@Component({
  selector: 'app-knowledge-settings',
  imports: [FormsModule, KnowledgeDetailShellComponent],
  template: `
    @if (kbId()) {
      <app-knowledge-detail-shell [kbId]="kbId()!">
        <h2 class="feature-title" style="font-size:1.1rem">System Prompt</h2>
        <p class="feature-desc">Định nghĩa cách AI trả lời dựa trên dữ liệu đã huấn luyện</p>

        <div class="feature-form-card" style="flex-direction:column;align-items:stretch;gap:0.75rem">
          <textarea
            [(ngModel)]="systemPrompt"
            class="feature-textarea"
            rows="8"
            placeholder="Bạn là chuyên gia... Chỉ trả lời dựa trên dữ liệu đã huấn luyện."></textarea>
          @if (saved()) {
            <p style="color:#10b981;font-size:0.875rem">Đã lưu!</p>
          }
          @if (error()) {
            <p class="feature-alert">{{ error() }}</p>
          }
          <button type="button" class="feature-btn feature-btn--primary feature-btn--sm" [disabled]="saving()" (click)="save()">
            {{ saving() ? 'Đang lưu...' : 'Lưu prompt' }}
          </button>
        </div>
      </app-knowledge-detail-shell>
    }
  `
})
export class KnowledgeSettingsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private service = inject(KnowledgeBaseService);

  kbId = signal<number | null>(null);
  systemPrompt = '';
  saving = signal(false);
  saved = signal(false);
  error = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;
    this.kbId.set(id);
    this.service.get(id).subscribe({
      next: kb => { this.systemPrompt = kb.systemPrompt || ''; }
    });
  }

  save(): void {
    const id = this.kbId();
    if (!id) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set('');
    this.service.updatePrompt(id, this.systemPrompt).subscribe({
      next: () => { this.saving.set(false); this.saved.set(true); },
      error: err => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Không thể lưu');
      }
    });
  }
}
