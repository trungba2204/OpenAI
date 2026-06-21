import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { AdminChartComponent } from '../shared/admin-chart/admin-chart.component';
import { ModelStatistic } from '../../../core/models/admin';

@Component({
  selector: 'app-admin-models',
  imports: [AdminChartComponent],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">Model Analytics</h1>
          <p class="admin-desc">Thống kê sử dụng theo model</p>
        </div>
      </div>

      @if (models().length) {
        <div class="admin-charts">
          <app-admin-chart title="Requests by Model" type="pie" [labels]="labels()" [values]="values()" />
          <app-admin-chart title="Requests (Bar)" type="bar" [labels]="labels()" [values]="values()" />
        </div>
      } @else {
        <p class="admin-empty">Chưa có dữ liệu model</p>
      }
    </div>
  `
})
export class AdminModelsComponent implements OnInit {
  private admin = inject(AdminService);

  models = signal<ModelStatistic[]>([]);
  labels = computed(() => this.models().map(m => m.model));
  values = computed(() => this.models().map(m => m.requests));

  ngOnInit(): void {
    this.admin.getModelStatistics().subscribe(m => this.models.set(m));
  }
}
