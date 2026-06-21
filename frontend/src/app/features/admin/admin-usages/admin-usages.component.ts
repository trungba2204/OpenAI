import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUsage, UsageFilters } from '../../../core/models/admin';

@Component({
  selector: 'app-admin-usages',
  imports: [DatePipe, DecimalPipe, FormsModule],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">AI Usage</h1>
          <p class="admin-desc">Theo dõi request gửi đến AI</p>
        </div>
      </div>

      <div class="admin-filters">
        <label>Model <input [(ngModel)]="filters.model" placeholder="GROQ_LLAMA_70B" /></label>
        <label>User ID <input type="number" [(ngModel)]="filters.userId" /></label>
        <label>Từ <input type="date" [(ngModel)]="filters.from" /></label>
        <label>Đến <input type="date" [(ngModel)]="filters.to" /></label>
        <button type="button" class="feature-btn feature-btn--primary" (click)="load()">Lọc</button>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User</th>
              <th>Model</th>
              <th>Tokens</th>
              <th>Cost</th>
              <th>Prompt</th>
            </tr>
          </thead>
          <tbody>
            @for (u of usages(); track u.id) {
              <tr>
                <td>{{ u.createdAt | date:'short' }}</td>
                <td>{{ u.userEmail }}</td>
                <td>{{ u.model }}</td>
                <td>{{ u.totalTokens }}</td>
                <td>{{ '$' }}{{ u.cost | number:'1.4-6' }}</td>
                <td class="admin-table__cell-clip" [title]="u.prompt">{{ u.prompt }}</td>
              </tr>
            }
          </tbody>
        </table>
        @if (usages().length === 0 && !loading()) {
          <p class="admin-empty">Chưa có usage nào</p>
        }
      </div>
    </div>
  `
})
export class AdminUsagesComponent implements OnInit {
  private admin = inject(AdminService);

  usages = signal<AdminUsage[]>([]);
  loading = signal(true);
  filters: UsageFilters = {};

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    const f: UsageFilters = {};
    if (this.filters.model?.trim()) f.model = this.filters.model.trim();
    if (this.filters.userId) f.userId = Number(this.filters.userId);
    if (this.filters.from) f.from = this.filters.from;
    if (this.filters.to) f.to = this.filters.to;
    this.admin.getUsages(f).subscribe({
      next: u => { this.usages.set(u); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
