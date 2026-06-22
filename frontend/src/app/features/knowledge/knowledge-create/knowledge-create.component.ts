import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { KnowledgeBaseService } from '../../../core/services/knowledge-base.service';

@Component({
  selector: 'app-knowledge-create',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="feature-container feature-container--narrow">
      <a routerLink="/knowledge" class="admin-link">← Danh sách kiến thức</a>
      <h1 class="feature-title">Tạo bộ kiến thức mới</h1>
      <p class="feature-desc">Đặt tên và mô tả AI assistant của bạn</p>

      <div class="feature-form-card" style="flex-direction:column;align-items:stretch;gap:0.75rem">
        <input [(ngModel)]="name" placeholder="Tên (vd: HR Assistant)" class="feature-input" />
        <textarea [(ngModel)]="description" placeholder="Mô tả ngắn" class="feature-textarea" rows="2"></textarea>
        <textarea [(ngModel)]="systemPrompt" placeholder="System prompt (tùy chọn)" class="feature-textarea" rows="4"></textarea>
        @if (error()) {
          <p class="feature-alert">{{ error() }}</p>
        }
        <div style="display:flex;gap:0.5rem">
          <button type="button" class="feature-btn feature-btn--primary" [disabled]="saving()" (click)="create()">
            {{ saving() ? 'Đang tạo...' : 'Tạo bộ kiến thức' }}
          </button>
          <a routerLink="/knowledge" class="feature-btn">Hủy</a>
        </div>
      </div>
    </div>
  `
})
export class KnowledgeCreateComponent {
  private service = inject(KnowledgeBaseService);
  private router = inject(Router);

  name = '';
  description = '';
  systemPrompt = '';
  saving = signal(false);
  error = signal('');

  create(): void {
    const trimmed = this.name.trim();
    if (!trimmed) {
      this.error.set('Vui lòng nhập tên bộ kiến thức');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.service.create({
      name: trimmed,
      description: this.description.trim() || undefined,
      systemPrompt: this.systemPrompt.trim() || undefined
    }).subscribe({
      next: kb => this.router.navigate(['/knowledge', kb.id, 'documents']),
      error: err => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Không thể tạo bộ kiến thức');
      }
    });
  }
}
