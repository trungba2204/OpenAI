import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser } from '../../../core/models/admin';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-users',
  imports: [DatePipe, DecimalPipe, RouterLink, ConfirmDialogComponent],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">User Management</h1>
          <p class="admin-desc">Quản lý tài khoản người dùng</p>
        </div>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Status</th>
              <th>Requests</th>
              <th>Tokens</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (u of users(); track u.id) {
              <tr>
                <td><a class="admin-link" [routerLink]="['/admin/users', u.id]">{{ u.email }}</a></td>
                <td>{{ u.fullName }}</td>
                <td>
                  <span class="admin-badge" [class.admin-badge--active]="u.status === 'ACTIVE'" [class.admin-badge--locked]="u.status === 'LOCKED'">
                    {{ u.status }}
                  </span>
                </td>
                <td>{{ u.totalRequests }}</td>
                <td>{{ u.totalTokens | number }}</td>
                <td>{{ u.createdAt | date:'short' }}</td>
                <td>
                  <div class="admin-actions">
                    @if (u.status === 'ACTIVE') {
                      <button type="button" class="feature-btn feature-btn--danger" (click)="openLock(u)">Khóa</button>
                    } @else {
                      <button type="button" class="feature-btn feature-btn--primary" (click)="openUnlock(u)">Mở khóa</button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (users().length === 0 && !loading()) {
          <p class="admin-empty">Chưa có người dùng</p>
        }
      </div>
    </div>

    <app-confirm-dialog
      [open]="dialogOpen()"
      [title]="dialogTitle()"
      [message]="dialogMessage()"
      [confirmLabel]="dialogAction() === 'lock' ? 'Khóa' : 'Mở khóa'"
      cancelLabel="Hủy"
      (confirm)="confirmAction()"
      (cancel)="closeDialog()" />
  `
})
export class AdminUsersComponent implements OnInit {
  private admin = inject(AdminService);

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  dialogOpen = signal(false);
  dialogTitle = signal('');
  dialogMessage = signal('');
  dialogAction = signal<'lock' | 'unlock'>('lock');
  targetUser = signal<AdminUser | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.admin.getUsers().subscribe({
      next: u => { this.users.set(u); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openLock(user: AdminUser): void {
    this.targetUser.set(user);
    this.dialogAction.set('lock');
    this.dialogTitle.set('Khóa tài khoản');
    this.dialogMessage.set(`Khóa tài khoản "${user.email}"? Người dùng sẽ không đăng nhập được.`);
    this.dialogOpen.set(true);
  }

  openUnlock(user: AdminUser): void {
    this.targetUser.set(user);
    this.dialogAction.set('unlock');
    this.dialogTitle.set('Mở khóa tài khoản');
    this.dialogMessage.set(`Mở khóa tài khoản "${user.email}"?`);
    this.dialogOpen.set(true);
  }

  closeDialog(): void {
    this.dialogOpen.set(false);
    this.targetUser.set(null);
  }

  confirmAction(): void {
    const user = this.targetUser();
    if (!user) return;
    const req = this.dialogAction() === 'lock'
      ? this.admin.lockUser(user.id)
      : this.admin.unlockUser(user.id);
    req.subscribe({
      next: () => { this.closeDialog(); this.load(); },
      error: () => this.closeDialog()
    });
  }
}
