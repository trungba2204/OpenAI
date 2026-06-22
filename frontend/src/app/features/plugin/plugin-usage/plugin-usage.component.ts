import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PluginService } from '../../../core/services/plugin.service';
import { PluginUsageSummary } from '../../../core/models/plugin';

@Component({
  selector: 'app-plugin-usage',
  imports: [DecimalPipe, RouterLink],
  template: `
    <div class="feature-container">
      <a routerLink="/plugins" class="admin-link">← Plugin Hub</a>
      <h1 class="feature-title">Plugin Usage</h1>
      <p class="feature-desc">Thống kê request và token từ plugin IDE</p>

      @if (loading()) {
        <p class="feature-empty">Đang tải...</p>
      } @else if (usage()) {
        <div class="plugin-stats">
          <div class="plugin-stat-card">
            <span class="plugin-stat-card__value">{{ usage()!.totalRequests }}</span>
            <span class="plugin-stat-card__label">Tổng request</span>
          </div>
          <div class="plugin-stat-card">
            <span class="plugin-stat-card__value">{{ usage()!.totalTokens | number }}</span>
            <span class="plugin-stat-card__label">Tổng token (ước tính)</span>
          </div>
        </div>
      }
    </div>
  `
})
export class PluginUsageComponent implements OnInit {
  private pluginService = inject(PluginService);

  usage = signal<PluginUsageSummary | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.pluginService.getUsage().subscribe({
      next: u => { this.usage.set(u); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
