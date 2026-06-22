import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { KnowledgeBaseService } from '../../../core/services/knowledge-base.service';
import { KnowledgeBase } from '../../../core/models/knowledge';

@Component({
  selector: 'app-knowledge-list',
  imports: [DatePipe, RouterLink],
  template: `
    <div class="feature-container">
      <div class="feature-header">
        <div>
          <h1 class="feature-title">🧠 AI Knowledge</h1>
          <p class="feature-desc">Huấn luyện AI bằng tài liệu riêng và chat với bộ kiến thức</p>
        </div>
        <a routerLink="/knowledge/create" class="feature-btn feature-btn--primary">+ Bộ kiến thức mới</a>
      </div>

      @if (loading()) {
        <p class="feature-empty">Đang tải...</p>
      } @else if (items().length === 0) {
        <p class="feature-empty">Chưa có bộ kiến thức. Tạo mới để bắt đầu huấn luyện AI.</p>
      } @else {
        <div class="knowledge-grid">
          @for (kb of items(); track kb.id) {
            <a class="knowledge-card" [routerLink]="['/knowledge', kb.id, 'documents']">
              <h3>{{ kb.name }}</h3>
              <p>{{ kb.documentCount }} tài liệu · {{ kb.status }} · {{ kb.updatedAt | date:'short' }}</p>
              @if (kb.description) {
                <p style="margin-top:0.5rem">{{ kb.description }}</p>
              }
            </a>
          }
        </div>
      }
    </div>
  `
})
export class KnowledgeListComponent implements OnInit {
  private service = inject(KnowledgeBaseService);

  items = signal<KnowledgeBase[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.service.list().subscribe({
      next: list => { this.items.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
