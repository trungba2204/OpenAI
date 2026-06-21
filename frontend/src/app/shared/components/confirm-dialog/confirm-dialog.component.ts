import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  template: `
    @if (open()) {
      <div class="chat-dialog-backdrop" (click)="onBackdropClick()">
        <div
          class="chat-dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'chat-dialog-title'"
          (click)="$event.stopPropagation()">
          <h3 id="chat-dialog-title" class="chat-dialog__title">{{ title() }}</h3>
          <p class="chat-dialog__message">{{ message() }}</p>
          <div class="chat-dialog__actions">
            @if (!error()) {
              <button type="button" class="chat-dialog__btn chat-dialog__btn--secondary" (click)="cancel.emit()">
                {{ cancelLabel() }}
              </button>
              <button type="button" class="chat-dialog__btn chat-dialog__btn--danger" (click)="confirm.emit()">
                {{ confirmLabel() }}
              </button>
            } @else {
              <button type="button" class="chat-dialog__btn chat-dialog__btn--primary" (click)="cancel.emit()">
                Đóng
              </button>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDialogComponent {
  open = input(false);
  title = input('Xác nhận');
  message = input('');
  confirmLabel = input('Xác nhận');
  cancelLabel = input('Hủy');
  error = input<string | null>(null);
  closeOnBackdrop = input(true);

  confirm = output<void>();
  cancel = output<void>();

  onBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.cancel.emit();
    }
  }
}
