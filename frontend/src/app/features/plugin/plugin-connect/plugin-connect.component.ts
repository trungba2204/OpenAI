import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PluginService } from '../../../core/services/plugin.service';

@Component({
  selector: 'app-plugin-connect',
  imports: [RouterLink],
  template: `
    <div class="feature-container feature-container--narrow">
      <a routerLink="/plugins" class="admin-link">← Plugin Hub</a>
      <h1 class="feature-title">Kết nối Extension</h1>
      <p class="feature-desc">Nhập mã này trong VS Code extension (lệnh: AI Platform: Connect with Device Code)</p>

      @if (connected()) {
        <div class="plugin-connect-success">
          <p class="plugin-connect-success__title">✓ Extension đã kết nối thành công</p>
          <p class="plugin-connect-success__hint">Bạn có thể mở sidebar AI Platform trong VS Code và bắt đầu chat.</p>
        </div>
      } @else {
        <div class="feature-alert" style="margin-bottom:1rem;font-size:0.8125rem">
          Chưa thấy lệnh trên VS Code? Cài extension từ file
          <code>vscode-extension/ai-platform-vscode-0.2.3.vsix</code>
          (Extensions → Install from VSIX) rồi reload VS Code.
        </div>

        @if (loading()) {
          <p class="feature-empty">Đang tạo mã...</p>
        } @else if (code()) {
          <div class="plugin-device-code">
            <span class="plugin-device-code__value">{{ code() }}</span>
            <p class="plugin-device-code__hint">
              @if (polling()) {
                Đang chờ extension nhập mã...
              } @else {
                Hết hạn sau {{ remaining() }} phút
              }
            </p>
            <button type="button" class="feature-btn feature-btn--sm" (click)="refresh()">Tạo mã mới</button>
          </div>
        } @else if (error()) {
          <p class="feature-alert">{{ error() }}</p>
          <button type="button" class="feature-btn feature-btn--primary feature-btn--sm" (click)="refresh()">Thử lại</button>
        }
      }

      <div class="feature-form-card" style="flex-direction:column;align-items:stretch;margin-top:1.5rem">
        <h3 style="margin:0;font-size:0.95rem">Hướng dẫn</h3>
        <ol style="margin:0.5rem 0 0;padding-left:1.25rem;font-size:0.875rem;color:var(--text-secondary);line-height:1.8">
          <li>Mở VS Code → Command Palette → <strong>AI Platform: Connect with Device Code</strong></li>
          <li>Nhập mã 6 ký tự ở trên</li>
          <li>Trang web tự hiển thị <strong>Đã kết nối</strong> khi extension nhận token</li>
        </ol>
      </div>
    </div>
  `
})
export class PluginConnectComponent implements OnInit, OnDestroy {
  private pluginService = inject(PluginService);

  code = signal('');
  expiresAt = signal<Date | null>(null);
  loading = signal(true);
  error = signal('');
  remaining = signal(10);
  connected = signal(false);
  polling = signal(false);
  private timer: ReturnType<typeof setInterval> | null = null;
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.checkConnection();
    this.refresh();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopPoll();
  }

  refresh(): void {
    if (this.connected()) return;
    this.loading.set(true);
    this.error.set('');
    this.pluginService.createDeviceCode().subscribe({
      next: res => {
        this.code.set(res.code);
        this.expiresAt.set(new Date(res.expiresAt));
        this.loading.set(false);
        this.startTimer();
        this.startPoll(res.code);
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Không tạo được mã');
      }
    });
  }

  private checkConnection(): void {
    this.pluginService.getConnectionStatus().subscribe({
      next: s => { if (s.connected) this.markConnected(); }
    });
  }

  private markConnected(): void {
    this.connected.set(true);
    this.polling.set(false);
    this.stopPoll();
    this.stopTimer();
    this.pluginService.notifyConnectionChanged();
  }

  private startPoll(code: string): void {
    this.stopPoll();
    this.polling.set(true);
    this.pollTimer = setInterval(() => {
      this.pluginService.getDeviceCodeStatus(code).subscribe({
        next: res => {
          if (res.status === 'CONNECTED') {
            this.markConnected();
          } else if (res.status === 'EXPIRED') {
            this.polling.set(false);
            this.stopPoll();
            this.refresh();
          }
        }
      });
      this.pluginService.getConnectionStatus().subscribe({
        next: s => { if (s.connected) this.markConnected(); }
      });
    }, 2500);
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      const exp = this.expiresAt();
      if (!exp) return;
      const mins = Math.max(0, Math.ceil((exp.getTime() - Date.now()) / 60000));
      this.remaining.set(mins);
      if (mins <= 0 && !this.connected()) this.refresh();
    }, 5000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private stopPoll(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
}
