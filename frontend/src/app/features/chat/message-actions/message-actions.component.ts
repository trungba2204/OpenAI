import { Component, input, output, signal } from '@angular/core';

type Feedback = 'up' | 'down' | null;

@Component({
  selector: 'app-message-actions',
  template: `
    <div class="chat-msg-actions">
      <button type="button" class="chat-msg-actions__btn" (click)="onCopy()" [title]="copied() ? 'Đã sao chép' : 'Sao chép'">
        @if (copied()) {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        } @else {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="1.5"/>
            <path stroke-linecap="round" d="M5 15V5a2 2 0 0 1 2-2h10"/>
          </svg>
        }
      </button>

      <button type="button"
        class="chat-msg-actions__btn"
        [class.active]="feedback() === 'up'"
        (click)="setFeedback('up')"
        title="Hữu ích">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7 10v9m0-9c0-1.1.9-2 2-2h1.5l1.2-2.1c.2-.35.6-.55 1-.55h.8c.55 0 1 .45 1 1v2.15M7 10H5.5A1.5 1.5 0 0 0 4 11.5v6A1.5 1.5 0 0 0 5.5 19H7m0-9h2.5c.83 0 1.5.67 1.5 1.5v6c0 .83-.67 1.5-1.5 1.5H7"/>
        </svg>
      </button>

      <button type="button"
        class="chat-msg-actions__btn"
        [class.active]="feedback() === 'down'"
        (click)="setFeedback('down')"
        title="Không hữu ích">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 14V5m0 9c0 1.1-.9 2-2 2h-1.5l-1.2 2.1c-.2.35-.6.55-1 .55h-.8c-.55 0-1-.45-1-1V9.85M17 14h1.5a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18.5 5H17m0 9h-2.5a1.5 1.5 0 0 1-1.5-1.5v-6c0-.83.67-1.5 1.5-1.5H17"/>
        </svg>
      </button>

      <button type="button" class="chat-msg-actions__btn" (click)="onShare()" title="Chia sẻ">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 16V4m0 0 3.5 3.5M12 4 8.5 7.5M6 14v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"/>
        </svg>
      </button>

      <button type="button" class="chat-msg-actions__btn" (click)="regenerate.emit()" title="Tạo lại câu trả lời">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5"/>
        </svg>
      </button>

      <div class="chat-msg-actions__more">
        <button type="button" class="chat-msg-actions__btn" (click)="toggleMenu($event)" title="Thêm tùy chọn">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
          </svg>
        </button>
        @if (menuOpen()) {
          <div class="chat-msg-actions__menu">
            <button type="button" (click)="onCopy(); closeMenu()">Sao chép văn bản</button>
            <button type="button" (click)="onShare(); closeMenu()">Chia sẻ</button>
            <button type="button" (click)="regenerate.emit(); closeMenu()">Tạo lại</button>
          </div>
        }
      </div>

      <button type="button"
        class="chat-msg-actions__source"
        [class.active]="sourcesOpen()"
        (click)="toggleSources()"
        title="Nguồn tham khảo">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 5.5A2.5 2.5 0 0 1 8.5 3h7A2.5 2.5 0 0 1 18 5.5v13a.75.75 0 0 1-1.16.63L12 16.75l-4.84 2.88A.75.75 0 0 1 6 18.5v-13Z"/>
        </svg>
        <span>Nguồn</span>
      </button>
    </div>

    @if (sourcesOpen()) {
      <div class="chat-msg-sources">
        <p>Chưa có nguồn tham khảo được trích dẫn cho câu trả lời này.</p>
      </div>
    }
  `,
  host: {
    '(document:click)': 'closeMenu()'
  }
})
export class MessageActionsComponent {
  content = input.required<string>();

  regenerate = output<void>();

  copied = signal(false);
  feedback = signal<Feedback>(null);
  menuOpen = signal(false);
  sourcesOpen = signal(false);

  async onCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.content());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      // ignore
    }
  }

  setFeedback(value: 'up' | 'down'): void {
    this.feedback.update(current => current === value ? null : value);
  }

  async onShare(): Promise<void> {
    const text = this.content();
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // cancelled
      }
    }
    await this.onCopy();
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleSources(): void {
    this.sourcesOpen.update(v => !v);
  }
}
