import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Subscription } from 'rxjs';
import { PluginService } from '../../../core/services/plugin.service';
import { PluginConnectionStatus } from '../../../core/models/plugin';

@Component({
  selector: 'app-plugin-connection-status',
  imports: [DatePipe],
  styles: [`
    :host {
      display: block;
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 1190;
      max-width: min(340px, calc(100vw - 2rem));
    }
  `],
  template: `
    <div class="plugin-connection-status" [class.plugin-connection-status--on]="status()?.connected">
      <span class="plugin-connection-status__dot" aria-hidden="true"></span>
      <div class="plugin-connection-status__text">
        <strong>{{ status()?.connected ? 'Đã kết nối' : 'Chưa kết nối' }}</strong>
        @if (status()?.connected && status()?.projectName) {
          <span class="plugin-connection-status__meta">{{ status()!.projectName }}</span>
        } @else if (status()?.connected && status()?.lastSeenAt) {
          <span class="plugin-connection-status__meta">Hoạt động {{ status()!.lastSeenAt | date:'short' }}</span>
        } @else if (!status()?.connected) {
          <span class="plugin-connection-status__meta">Mở VS Code và nhập mã kết nối</span>
        }
      </div>
    </div>
  `
})
export class PluginConnectionStatusComponent implements OnInit, OnDestroy {
  private pluginService = inject(PluginService);

  status = signal<PluginConnectionStatus | null>(null);
  private timer: ReturnType<typeof setInterval> | null = null;
  private sub: Subscription | null = null;

  ngOnInit(): void {
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 8000);
    this.sub = this.pluginService.connectionRefresh$.subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.sub?.unsubscribe();
  }

  refresh(): void {
    this.pluginService.getConnectionStatus().subscribe({
      next: s => this.status.set(s),
      error: () => this.status.set({ connected: false })
    });
  }
}
