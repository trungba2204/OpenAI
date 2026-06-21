import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { AgentService } from '../../../core/services/agent.service';
import { AgentRun } from '../../../core/models';

@Component({
  selector: 'app-agent-page',
  imports: [DatePipe, SidebarComponent],
  template: `
    <div class="feature-layout">
      <app-sidebar [conversations]="[]" [activeId]="null" (newChat)="goChat()" (selectConversation)="goChat()" />

      <main class="feature-main feature-main--scroll">
        <div class="feature-container feature-container--narrow">
          <h1 class="feature-title">🤖 Agent Runs</h1>
          <p class="feature-desc">
            Lịch sử các tool mà Agent đã gọi. Bật Agent Mode trong Chat để sử dụng.
          </p>

          <div class="feature-list">
            @for (run of runs(); track run.id) {
              <details class="feature-details">
                <summary>
                  <span class="feature-details__icon">🔧</span>
                  <span class="feature-details__name">{{ run.toolName }}</span>
                  <span class="feature-details__date">{{ run.createdAt | date:'short' }}</span>
                </summary>
                <div class="feature-details__body">
                  <div>
                    <p class="feature-details__label">Input</p>
                    <pre>{{ run.input }}</pre>
                  </div>
                  <div>
                    <p class="feature-details__label">Output</p>
                    <pre>{{ run.output }}</pre>
                  </div>
                </div>
              </details>
            }
          </div>

          @if (runs().length === 0) {
            <p class="feature-empty">Chưa có agent run nào</p>
          }
        </div>
      </main>
    </div>
  `
})
export class AgentPageComponent implements OnInit {
  private agentService = inject(AgentService);
  runs = signal<AgentRun[]>([]);

  ngOnInit(): void {
    this.agentService.getRuns().subscribe(r => this.runs.set(r));
  }

  goChat(): void { window.location.href = '/chat'; }
}
