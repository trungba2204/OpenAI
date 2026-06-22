import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-plugin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="ide-mode-page">
      <main class="feature-main feature-main--scroll">
        <nav class="plugin-nav">
          <a routerLink="/plugins" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Tổng quan</a>
          <a routerLink="/plugins/connect" routerLinkActive="active">Kết nối</a>
          <a routerLink="/plugins/sessions" routerLinkActive="active">Phiên</a>
          <a routerLink="/plugins/usage" routerLinkActive="active">Usage</a>
        </nav>
        <router-outlet />
      </main>
    </div>
  `
})
export class PluginLayoutComponent {}
