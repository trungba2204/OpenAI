import { Component, inject, input, ElementRef, viewChild, effect, OnDestroy } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export type AdminChartType = 'line' | 'bar' | 'pie' | 'doughnut';

@Component({
  selector: 'app-admin-chart',
  template: `<div class="admin-chart-card"><h3>{{ title() }}</h3><canvas #canvas class="admin-chart-canvas"></canvas></div>`,
})
export class AdminChartComponent implements OnDestroy {
  title = input('');
  type = input<AdminChartType>('bar');
  labels = input<string[]>([]);
  values = input<number[]>([]);

  private canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      this.labels();
      this.values();
      this.type();
      this.render();
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private render(): void {
    const el = this.canvas()?.nativeElement;
    if (!el) return;

    const labels = this.labels();
    const values = this.values();
    if (!labels.length) return;

    this.chart?.destroy();
    const config: ChartConfiguration = {
      type: this.type(),
      data: {
        labels,
        datasets: [{
          label: this.title(),
          data: values,
          backgroundColor: [
            'rgba(16,163,127,0.75)',
            'rgba(59,130,246,0.65)',
            'rgba(245,158,11,0.65)',
            'rgba(139,92,246,0.65)',
            'rgba(236,72,153,0.65)',
          ],
          borderColor: '#10a37f',
          borderWidth: 1,
          tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: this.type() === 'pie' || this.type() === 'doughnut' } },
        scales: this.type() === 'pie' || this.type() === 'doughnut' ? undefined : {
          y: { beginAtZero: true },
        },
      },
    };
    this.chart = new Chart(el, config);
  }
}
