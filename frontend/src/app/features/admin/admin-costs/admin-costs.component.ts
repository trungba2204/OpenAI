import { Component, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminChartComponent } from '../shared/admin-chart/admin-chart.component';

@Component({
  selector: 'app-admin-costs',
  imports: [DecimalPipe, AdminChartComponent],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">Cost Analytics</h1>
          <p class="admin-desc">Chi phí AI ước tính</p>
        </div>
      </div>

      @if (cost(); as c) {
        <div class="admin-stat-grid">
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ '$' }}{{ c.today | number:'1.2-4' }}</p><p class="admin-stat-card__label">Today</p></div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ '$' }}{{ c.month | number:'1.2-4' }}</p><p class="admin-stat-card__label">This Month</p></div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ '$' }}{{ c.year | number:'1.2-4' }}</p><p class="admin-stat-card__label">This Year</p></div>
        </div>

        @if (dayLabels().length) {
          <app-admin-chart title="Cost / Day (30d)" type="bar" [labels]="dayLabels()" [values]="dayValues()" />
        }
      }
    </div>
  `
})
export class AdminCostsComponent implements OnInit {
  private admin = inject(AdminService);

  cost = signal<{ today: number; month: number; year: number } | null>(null);
  dayLabels = signal<string[]>([]);
  dayValues = signal<number[]>([]);

  ngOnInit(): void {
    this.admin.getCostAnalytics().subscribe(c => {
      this.cost.set({ today: c.today, month: c.month, year: c.year });
      this.dayLabels.set(c.costPerDay.map(p => p.label));
      this.dayValues.set(c.costPerDay.map(p => p.value));
    });
  }
}
