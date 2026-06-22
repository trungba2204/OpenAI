import { Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { KnowledgeBaseService } from '../../../core/services/knowledge-base.service';
import { KnowledgeBase } from '../../../core/models/knowledge';

@Component({
  selector: 'app-knowledge-detail-shell',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="feature-container">
      <a routerLink="/knowledge" class="admin-link">← Danh sách kiến thức</a>

      @if (kb()) {
        <div class="feature-header">
          <div>
            <h1 class="feature-title">{{ kb()!.name }}</h1>
            @if (kb()!.description) {
              <p class="feature-desc">{{ kb()!.description }}</p>
            }
          </div>
        </div>

        <nav class="knowledge-nav">
          <a [routerLink]="['/knowledge', kbId(), 'documents']" routerLinkActive="active">📄 Tài liệu</a>
          <a [routerLink]="['/knowledge', kbId(), 'chat']" routerLinkActive="active">💬 Chat</a>
          <a [routerLink]="['/knowledge', kbId(), 'settings']" routerLinkActive="active">⚙️ Cài đặt</a>
          <a [routerLink]="['/knowledge', kbId(), 'analytics']" routerLinkActive="active">📊 Analytics</a>
        </nav>
      }

      <ng-content />
    </div>
  `
})
export class KnowledgeDetailShellComponent implements OnInit {
  kbId = input.required<number>();
  private service = inject(KnowledgeBaseService);

  kb = signal<KnowledgeBase | null>(null);

  ngOnInit(): void {
    this.service.get(this.kbId()).subscribe({
      next: kb => this.kb.set(kb),
      error: () => this.kb.set(null)
    });
  }
}
