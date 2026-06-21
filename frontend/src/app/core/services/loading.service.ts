import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = 0;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private shownAt = 0;

  private static readonly MIN_VISIBLE_MS = 350;

  readonly visible = signal(false);
  readonly message = signal('Đang xử lý...');

  start(message = 'Đang xử lý...'): void {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    this.pending++;
    this.message.set(message);

    if (this.pending === 1) {
      this.shownAt = Date.now();
      this.visible.set(true);
    }
  }

  end(): void {
    this.pending = Math.max(0, this.pending - 1);

    if (this.pending > 0) {
      return;
    }

    const elapsed = Date.now() - this.shownAt;
    const remaining = Math.max(0, LoadingService.MIN_VISIBLE_MS - elapsed);

    this.hideTimer = setTimeout(() => {
      if (this.pending === 0) {
        this.visible.set(false);
      }
      this.hideTimer = null;
    }, remaining);
  }
}
