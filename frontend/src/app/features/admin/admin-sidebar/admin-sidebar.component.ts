import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="admin-sidebar">
      <div class="admin-sidebar__brand">Admin Portal</div>

      <nav class="admin-sidebar__nav">
        <a routerLink="/admin/dashboard" routerLinkActive="active" class="admin-sidebar__link">📊 Dashboard</a>
        <a routerLink="/admin/users" routerLinkActive="active" class="admin-sidebar__link">👥 Users</a>
        <a routerLink="/admin/usages" routerLinkActive="active" class="admin-sidebar__link">📈 AI Usage</a>
        <a routerLink="/admin/conversations" routerLinkActive="active" class="admin-sidebar__link">💬 Conversations</a>
        <a routerLink="/admin/models" routerLinkActive="active" class="admin-sidebar__link">🤖 Models</a>
        <a routerLink="/admin/tokens" routerLinkActive="active" class="admin-sidebar__link">🔢 Tokens</a>
        <a routerLink="/admin/costs" routerLinkActive="active" class="admin-sidebar__link">💰 Costs</a>
      </nav>

      <div class="admin-sidebar__footer">
        <div class="admin-sidebar__user">
          <p class="name">{{ auth.currentUser()?.fullName }}</p>
          <p class="email">{{ auth.currentUser()?.email }}</p>
        </div>
        <div class="admin-sidebar__actions">
          <button type="button" class="chat-icon-btn" (click)="theme.toggle()" title="Đổi theme">
            {{ theme.isDark() ? '☀️' : '🌙' }}
          </button>
          <button type="button" class="chat-icon-btn" (click)="auth.logoutAdmin()" title="Đăng xuất">⏻</button>
        </div>
      </div>
    </aside>
  `
})
export class AdminSidebarComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
}
