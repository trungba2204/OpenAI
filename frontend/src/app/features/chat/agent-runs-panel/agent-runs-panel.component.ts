import { Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AgentRun } from '../../../core/models';

@Component({
  selector: 'app-agent-runs-panel',
  imports: [DatePipe],
  template: `
    <aside class="chat-agent-runs" aria-label="Agent runs">
      <div class="chat-agent-runs__header">
        <h3 class="chat-agent-runs__title">🔧 Agent Runs</h3>
        <button type="button" class="chat-agent-runs__refresh" (click)="refresh.emit()" title="Làm mới">
          ↻
        </button>
      </div>

      <div class="chat-agent-runs__list">
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
        } @empty {
          <p class="chat-agent-runs__empty">Chưa có tool call nào. Gửi tin nhắn để agent bắt đầu.</p>
        }
      </div>
    </aside>
  `
})
export class AgentRunsPanelComponent {
  runs = input<AgentRun[]>([]);
  refresh = output<void>();
}
