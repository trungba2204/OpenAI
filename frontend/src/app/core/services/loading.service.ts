import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private pending = 0;
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  readonly visible = signal(false);
  readonly message = signal('Đang xử lý...');

  start(message = 'Đang xử lý...'): void {
    this.pending++;
    this.message.set(message);

    if (this.pending === 1 && !this.showTimer && !this.visible()) {
      this.showTimer = setTimeout(() => {
        if (this.pending > 0) {
          this.visible.set(true);
        }
        this.showTimer = null;
      }, 280);
    }
  }

  end(): void {
    this.pending = Math.max(0, this.pending - 1);

    if (this.pending === 0) {
      if (this.showTimer) {
        clearTimeout(this.showTimer);
        this.showTimer = null;
      }
      this.visible.set(false);
    }
  }
}
