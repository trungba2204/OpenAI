import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminChartComponent } from '../shared/admin-chart/admin-chart.component';
import { AdminDashboard, ModelStatistic } from '../../../core/models/admin';

@Component({
  selector: 'app-admin-dashboard',
  imports: [DatePipe, DecimalPipe, RouterLink, AdminChartComponent],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">Dashboard</h1>
          <p class="admin-desc">Tổng quan hoạt động nền tảng AI</p>
        </div>
      </div>

      @if (dashboard(); as d) {
        <div class="admin-stat-grid">
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ d.totalUsers }}</p><p class="admin-stat-card__label">Total Users</p></div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ d.totalChats }}</p><p class="admin-stat-card__label">Conversations</p></div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ d.totalRequests }}</p><p class="admin-stat-card__label">AI Requests</p></div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ d.totalTokens | number }}</p><p class="admin-stat-card__label">Total Tokens</p></div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ '$' }}{{ d.totalCost | number:'1.2-4' }}</p><p class="admin-stat-card__label">Total Cost</p></div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ d.activeUsersToday }}</p><p class="admin-stat-card__label">Active Today</p></div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ d.pluginRequests }}</p><p class="admin-stat-card__label">Plugin Requests</p></div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ d.pluginActiveSessions }}</p><p class="admin-stat-card__label">Plugin Sessions (24h)</p></div>
        </div>

        <div class="admin-header" style="margin-top:1rem">
          <a routerLink="/admin/plugins" class="feature-btn">Quản lý VS Code Plugin →</a>
        </div>

        <div class="admin-charts">
          @if (modelLabels().length) {
            <app-admin-chart title="Requests by Model" type="doughnut" [labels]="modelLabels()" [values]="modelValues()" />
          }
          @if (tokenLabels().length) {
            <app-admin-chart title="Tokens / Day (30d)" type="line" [labels]="tokenLabels()" [values]="tokenValues()" />
          }
        </div>
      } @else if (loading()) {
        <p class="admin-empty">Đang tải...</p>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private admin = inject(AdminService);

  dashboard = signal<AdminDashboard | null>(null);
  models = signal<ModelStatistic[]>([]);
  tokenLabels = signal<string[]>([]);
  tokenValues = signal<number[]>([]);
  loading = signal(true);

  modelLabels = computed(() => this.models().map(m => m.model));
  modelValues = computed(() => this.models().map(m => m.requests));

  ngOnInit(): void {
    this.admin.getDashboard().subscribe({
      next: d => { this.dashboard.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.admin.getModelStatistics().subscribe(m => this.models.set(m));
    this.admin.getTokenAnalytics().subscribe(t => {
      this.tokenLabels.set(t.tokensPerDay.map(p => p.label));
      this.tokenValues.set(t.tokensPerDay.map(p => p.value));
    });
  }
}
