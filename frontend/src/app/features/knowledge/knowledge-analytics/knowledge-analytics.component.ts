import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KnowledgeDetailShellComponent } from '../knowledge-detail-shell/knowledge-detail-shell.component';

@Component({
  selector: 'app-knowledge-analytics',
  imports: [KnowledgeDetailShellComponent],
  template: `
    @if (kbId()) {
      <app-knowledge-detail-shell [kbId]="kbId()!">
        <p class="feature-empty">Analytics sẽ có trong Phase 2 — theo dõi tài liệu, chunk, câu hỏi và token.</p>
      </app-knowledge-detail-shell>
    }
  `
})
export class KnowledgeAnalyticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  kbId = signal<number | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) this.kbId.set(id);
  }
}
