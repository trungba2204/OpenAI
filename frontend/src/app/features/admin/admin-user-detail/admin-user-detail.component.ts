import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser } from '../../../core/models/admin';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-user-detail',
  imports: [DatePipe, DecimalPipe, RouterLink, ConfirmDialogComponent],
  template: `
    <div class="admin-container">
      <a routerLink="/admin/users" class="admin-link">← Danh sách users</a>

      @if (user(); as u) {
        <div class="admin-header" style="margin-top: 1rem">
          <div>
            <h1 class="admin-title">{{ u.fullName }}</h1>
            <p class="admin-desc">{{ u.email }}</p>
          </div>
          <div class="admin-actions">
            @if (u.status === 'ACTIVE') {
              <button type="button" class="feature-btn feature-btn--danger" (click)="openLock()">Khóa tài khoản</button>
            } @else {
              <button type="button" class="feature-btn feature-btn--primary" (click)="openUnlock()">Mở khóa</button>
            }
          </div>
        </div>

        <div class="admin-stat-grid">
          <div class="admin-stat-card">
            <p class="admin-stat-card__value">
              <span class="admin-badge" [class.admin-badge--active]="u.status === 'ACTIVE'" [class.admin-badge--locked]="u.status === 'LOCKED'">{{ u.status }}</span>
            </p>
            <p class="admin-stat-card__label">Status</p>
          </div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ u.totalRequests }}</p><p class="admin-stat-card__label">Total Requests</p></div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ u.totalTokens | number }}</p><p class="admin-stat-card__label">Total Tokens</p></div>
          <div class="admin-stat-card"><p class="admin-stat-card__value">{{ u.createdAt | date:'medium' }}</p><p class="admin-stat-card__label">Created</p></div>
        </div>
      }
    </div>

    <app-confirm-dialog
      [open]="dialogOpen()"
      [title]="dialogTitle()"
      [message]="dialogMessage()"
      [confirmLabel]="pendingLock() ? 'Khóa' : 'Mở khóa'"
      cancelLabel="Hủy"
      (confirm)="confirmAction()"
      (cancel)="dialogOpen.set(false)" />
  `
})
export class AdminUserDetailComponent implements OnInit {
  private admin = inject(AdminService);
  private route = inject(ActivatedRoute);

  user = signal<AdminUser | null>(null);
  dialogOpen = signal(false);
  dialogTitle = signal('');
  dialogMessage = signal('');
  pendingLock = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.admin.getUser(id).subscribe(u => this.user.set(u));
  }

  openLock(): void {
    const u = this.user();
    if (!u) return;
    this.pendingLock.set(true);
    this.dialogTitle.set('Khóa tài khoản');
    this.dialogMessage.set(`Khóa "${u.email}"?`);
    this.dialogOpen.set(true);
  }

  openUnlock(): void {
    const u = this.user();
    if (!u) return;
    this.pendingLock.set(false);
    this.dialogTitle.set('Mở khóa tài khoản');
    this.dialogMessage.set(`Mở khóa "${u.email}"?`);
    this.dialogOpen.set(true);
  }

  confirmAction(): void {
    const u = this.user();
    if (!u) return;
    const req = this.pendingLock() ? this.admin.lockUser(u.id) : this.admin.unlockUser(u.id);
    req.subscribe({
      next: updated => { this.user.set(updated); this.dialogOpen.set(false); },
      error: () => this.dialogOpen.set(false)
    });
  }
}
