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

      <div class="feature-alert" style="margin-bottom:1rem;font-size:0.8125rem">
        Chưa thấy lệnh trên VS Code? Cài extension từ file
        <code>vscode-extension/ai-platform-vscode-0.1.0.vsix</code>
        (Extensions → Install from VSIX) rồi reload VS Code.
      </div>

      @if (loading()) {
        <p class="feature-empty">Đang tạo mã...</p>
      } @else if (code()) {
        <div class="plugin-device-code">
          <span class="plugin-device-code__value">{{ code() }}</span>
          <p class="plugin-device-code__hint">Hết hạn sau {{ remaining() }} phút</p>
          <button type="button" class="feature-btn feature-btn--sm" (click)="refresh()">Tạo mã mới</button>
        </div>
      } @else if (error()) {
        <p class="feature-alert">{{ error() }}</p>
        <button type="button" class="feature-btn feature-btn--primary feature-btn--sm" (click)="refresh()">Thử lại</button>
      }

      <div class="feature-form-card" style="flex-direction:column;align-items:stretch;margin-top:1.5rem">
        <h3 style="margin:0;font-size:0.95rem">Hướng dẫn</h3>
        <ol style="margin:0.5rem 0 0;padding-left:1.25rem;font-size:0.875rem;color:var(--text-secondary);line-height:1.8">
          <li>Mở VS Code → Command Palette → <strong>AI Platform: Connect with Device Code</strong></li>
          <li>Nhập mã 6 ký tự ở trên</li>
          <li>Extension nhận token và sẵn sàng chat</li>
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
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set('');
    this.pluginService.createDeviceCode().subscribe({
      next: res => {
        this.code.set(res.code);
        this.expiresAt.set(new Date(res.expiresAt));
        this.loading.set(false);
        this.startTimer();
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Không tạo được mã');
      }
    });
  }

  private startTimer(): void {
    this.stopTimer();
    this.timer = setInterval(() => {
      const exp = this.expiresAt();
      if (!exp) return;
      const mins = Math.max(0, Math.ceil((exp.getTime() - Date.now()) / 60000));
      this.remaining.set(mins);
      if (mins <= 0) this.refresh();
    }, 5000);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
