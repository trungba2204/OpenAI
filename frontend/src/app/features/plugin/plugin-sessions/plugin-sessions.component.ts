import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PluginService } from '../../../core/services/plugin.service';
import { PluginSession } from '../../../core/models/plugin';

@Component({
  selector: 'app-plugin-sessions',
  imports: [DatePipe, RouterLink],
  template: `
    <div class="feature-container">
      <a routerLink="/plugins" class="admin-link">← Plugin Hub</a>
      <h1 class="feature-title">Phiên Plugin</h1>
      <p class="feature-desc">Các editor đã kết nối gần đây</p>

      @if (loading()) {
        <p class="feature-empty">Đang tải...</p>
      } @else if (sessions().length === 0) {
        <p class="feature-empty">Chưa có phiên plugin. Kết nối VS Code extension để bắt đầu.</p>
      } @else {
        <ul class="feature-list">
          @for (s of sessions(); track s.id) {
            <li class="feature-list-item">
              <div>
                <strong>{{ s.editorType }}</strong>
                @if (s.projectName) {
                  <span style="margin-left:0.5rem;color:var(--text-secondary)">{{ s.projectName }}</span>
                }
                <p style="margin:0.25rem 0 0;font-size:0.75rem;color:var(--text-secondary)">
                  Hoạt động {{ s.lastSeenAt | date:'short' }}
                </p>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class PluginSessionsComponent implements OnInit {
  private pluginService = inject(PluginService);

  sessions = signal<PluginSession[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.pluginService.getSessions().subscribe({
      next: list => { this.sessions.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
