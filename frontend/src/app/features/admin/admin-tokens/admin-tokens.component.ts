import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { AdminChartComponent } from '../shared/admin-chart/admin-chart.component';
import { LabelValue } from '../../../core/models/admin';

@Component({
  selector: 'app-admin-tokens',
  imports: [DecimalPipe, AdminChartComponent],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">Token Analytics</h1>
          <p class="admin-desc">Token theo ngày, model và user</p>
        </div>
      </div>

      @if (dayLabels().length) {
        <div class="admin-charts">
          <app-admin-chart title="Tokens / Day" type="line" [labels]="dayLabels()" [values]="dayValues()" />
          <app-admin-chart title="Tokens / Model" type="bar" [labels]="modelLabels()" [values]="modelValues()" />
        </div>
      }

      <div class="admin-table-wrap" style="margin-top:1rem">
        <table class="admin-table">
          <thead><tr><th>User</th><th>Total Tokens</th></tr></thead>
          <tbody>
            @for (u of perUser(); track u.label) {
              <tr><td>{{ u.label }}</td><td>{{ u.value | number }}</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class AdminTokensComponent implements OnInit {
  private admin = inject(AdminService);

  dayLabels = signal<string[]>([]);
  dayValues = signal<number[]>([]);
  modelLabels = signal<string[]>([]);
  modelValues = signal<number[]>([]);
  perUser = signal<LabelValue[]>([]);

  ngOnInit(): void {
    this.admin.getTokenAnalytics().subscribe(t => {
      this.dayLabels.set(t.tokensPerDay.map(p => p.label));
      this.dayValues.set(t.tokensPerDay.map(p => p.value));
      this.modelLabels.set(t.tokensPerModel.map(p => p.label));
      this.modelValues.set(t.tokensPerModel.map(p => p.value));
      this.perUser.set(t.tokensPerUser);
    });
  }
}
