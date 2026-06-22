import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminChartComponent } from '../shared/admin-chart/admin-chart.component';
import {
  AdminPluginDashboard,
  AdminPluginInstallation,
  AdminPluginSession,
  AdminPluginUsage,
  PluginUsageFilters
} from '../../../core/models/admin';

@Component({
  selector: 'app-admin-plugins',
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink, AdminChartComponent],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">VS Code Plugin</h1>
          <p class="admin-desc">Quản lý extension IDE — phiên, cài đặt, request AI</p>
        </div>
        <a routerLink="/plugins" class="admin-link" target="_blank">Mở Plugin Hub ↗</a>
      </div>

      @if (dashboard(); as d) {
        <div class="admin-stat-grid">
          <div class="admin-stat-card">
            <p class="admin-stat-card__value">{{ d.totalInstallations }}</p>
            <p class="admin-stat-card__label">Cài đặt</p>
          </div>
          <div class="admin-stat-card">
            <p class="admin-stat-card__value">{{ d.activeSessions }}</p>
            <p class="admin-stat-card__label">Phiên active (24h)</p>
          </div>
          <div class="admin-stat-card">
            <p class="admin-stat-card__value">{{ d.totalRequests }}</p>
            <p class="admin-stat-card__label">Plugin requests</p>
          </div>
          <div class="admin-stat-card">
            <p class="admin-stat-card__value">{{ d.totalTokens | number }}</p>
            <p class="admin-stat-card__label">Plugin tokens</p>
          </div>
        </div>

        <div class="admin-charts">
          @if (editorLabels().length) {
            <app-admin-chart title="Request theo Editor" type="doughnut" [labels]="editorLabels()" [values]="editorValues()" />
          }
          @if (endpointLabels().length) {
            <app-admin-chart title="Request theo Endpoint" type="bar" [labels]="endpointLabels()" [values]="endpointValues()" />
          }
          @if (dayLabels().length) {
            <app-admin-chart title="Plugin requests / ngày (30d)" type="line" [labels]="dayLabels()" [values]="dayValues()" />
          }
        </div>
      }

      <h2 class="admin-section-title">Lịch sử request plugin</h2>
      <div class="admin-filters">
        <label>Editor
          <select [(ngModel)]="filters.editorType">
            <option value="">Tất cả</option>
            <option value="VSCODE">VS Code</option>
            <option value="INTELLIJ">IntelliJ</option>
            <option value="CURSOR">Cursor</option>
          </select>
        </label>
        <label>Endpoint <input [(ngModel)]="filters.endpoint" placeholder="chat, inline..." /></label>
        <label>User ID <input type="number" [(ngModel)]="filters.userId" /></label>
        <label>Từ <input type="date" [(ngModel)]="filters.from" /></label>
        <label>Đến <input type="date" [(ngModel)]="filters.to" /></label>
        <button type="button" class="feature-btn feature-btn--primary" (click)="loadUsages()">Lọc</button>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>User</th>
              <th>Editor</th>
              <th>Endpoint</th>
              <th>Model</th>
              <th>In</th>
              <th>Out</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            @for (u of usages(); track u.id) {
              <tr>
                <td>{{ u.createdAt | date:'short' }}</td>
                <td><a class="admin-link" [routerLink]="['/admin/users', u.userId]">{{ u.userEmail }}</a></td>
                <td>{{ u.editorType }}</td>
                <td>{{ u.endpoint }}</td>
                <td class="admin-table__cell-clip">{{ u.modelName || '—' }}</td>
                <td>{{ u.inputTokens | number }}</td>
                <td>{{ u.outputTokens | number }}</td>
                <td>{{ u.tokens | number }}</td>
              </tr>
            }
          </tbody>
        </table>
        @if (usages().length === 0 && !loadingUsages()) {
          <p class="admin-empty">Chưa có request từ plugin VS Code</p>
        }
      </div>

      <h2 class="admin-section-title">Phiên đang hoạt động</h2>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Editor</th>
              <th>Project</th>
              <th>Hoạt động</th>
              <th>Bắt đầu</th>
            </tr>
          </thead>
          <tbody>
            @for (s of sessions(); track s.id) {
              <tr>
                <td><a class="admin-link" [routerLink]="['/admin/users', s.userId]">{{ s.userEmail }}</a></td>
                <td>{{ s.editorType }}</td>
                <td>{{ s.projectName || '—' }}</td>
                <td>{{ s.lastSeenAt | date:'short' }}</td>
                <td>{{ s.createdAt | date:'short' }}</td>
              </tr>
            }
          </tbody>
        </table>
        @if (sessions().length === 0) {
          <p class="admin-empty">Chưa có phiên plugin</p>
        }
      </div>

      <h2 class="admin-section-title">Cài đặt extension</h2>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Editor</th>
              <th>Version</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            @for (i of installations(); track i.id) {
              <tr>
                <td><a class="admin-link" [routerLink]="['/admin/users', i.userId]">{{ i.userEmail }}</a></td>
                <td>{{ i.editorType }}</td>
                <td>{{ i.version || '—' }}</td>
                <td>{{ i.installedAt | date:'short' }}</td>
              </tr>
            }
          </tbody>
        </table>
        @if (installations().length === 0) {
          <p class="admin-empty">Chưa ghi nhận cài đặt — user cần kết nối extension</p>
        }
      </div>
    </div>
  `
})
export class AdminPluginsComponent implements OnInit {
  private admin = inject(AdminService);

  dashboard = signal<AdminPluginDashboard | null>(null);
  usages = signal<AdminPluginUsage[]>([]);
  sessions = signal<AdminPluginSession[]>([]);
  installations = signal<AdminPluginInstallation[]>([]);
  loadingUsages = signal(true);
  filters: PluginUsageFilters = {};

  editorLabels = computed(() => (this.dashboard()?.requestsByEditor ?? []).map(x => x.label));
  editorValues = computed(() => (this.dashboard()?.requestsByEditor ?? []).map(x => x.value));
  endpointLabels = computed(() => (this.dashboard()?.requestsByEndpoint ?? []).map(x => x.label));
  endpointValues = computed(() => (this.dashboard()?.requestsByEndpoint ?? []).map(x => x.value));
  dayLabels = computed(() => (this.dashboard()?.requestsPerDay ?? []).map(x => x.label));
  dayValues = computed(() => (this.dashboard()?.requestsPerDay ?? []).map(x => x.value));

  ngOnInit(): void {
    this.admin.getPluginDashboard().subscribe(d => this.dashboard.set(d));
    this.loadUsages();
    this.admin.getPluginSessions().subscribe(s => this.sessions.set(s));
    this.admin.getPluginInstallations().subscribe(i => this.installations.set(i));
  }

  loadUsages(): void {
    this.loadingUsages.set(true);
    const f: PluginUsageFilters = {};
    if (this.filters.editorType) f.editorType = this.filters.editorType;
    if (this.filters.endpoint?.trim()) f.endpoint = this.filters.endpoint.trim();
    if (this.filters.userId) f.userId = Number(this.filters.userId);
    if (this.filters.from) f.from = this.filters.from;
    if (this.filters.to) f.to = this.filters.to;
    this.admin.getPluginUsages(f).subscribe({
      next: u => { this.usages.set(u); this.loadingUsages.set(false); },
      error: () => this.loadingUsages.set(false)
    });
  }
}
