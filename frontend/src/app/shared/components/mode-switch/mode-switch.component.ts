import { Component, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AppMode, AppModeService } from '../../../core/services/app-mode.service';

@Component({
  selector: 'app-mode-switch',
  template: `
    @if (visible) {
      <div class="app-mode-switch" role="group" aria-label="Chuyển chế độ ứng dụng">
        <button
          type="button"
          class="app-mode-switch__btn"
          [class.app-mode-switch__btn--active]="modeService.mode() === 'chat'"
          [disabled]="modeService.transitioning()"
          (click)="select('chat')">
          <span class="app-mode-switch__icon">💬</span>
          <span>Chat</span>
        </button>
        <button
          type="button"
          class="app-mode-switch__btn"
          [class.app-mode-switch__btn--active]="modeService.mode() === 'knowledge'"
          [disabled]="modeService.transitioning()"
          (click)="select('knowledge')">
          <span class="app-mode-switch__icon">🧠</span>
          <span>Knowledge</span>
        </button>
        <button
          type="button"
          class="app-mode-switch__btn"
          [class.app-mode-switch__btn--active]="modeService.mode() === 'ide'"
          [disabled]="modeService.transitioning()"
          (click)="select('ide')">
          <span class="app-mode-switch__icon">💻</span>
          <span>IDE</span>
        </button>
        <span
          class="app-mode-switch__glow"
          [class.app-mode-switch__glow--knowledge]="modeService.mode() === 'knowledge'"
          [class.app-mode-switch__glow--ide]="modeService.mode() === 'ide'"></span>
      </div>
    }

    @if (modeService.transitioning()) {
      <div
        class="mode-transition"
        [class.mode-transition--chat]="modeService.transitionTarget() === 'chat'"
        [class.mode-transition--knowledge]="modeService.transitionTarget() === 'knowledge'"
        [class.mode-transition--ide]="modeService.transitionTarget() === 'ide'"
        aria-hidden="true">
        <div class="mode-transition__ring"></div>
        <div class="mode-transition__ring mode-transition__ring--delay"></div>
        <div class="mode-transition__flash"></div>
        <p class="mode-transition__label">{{ modeService.transitionLabel() }}</p>
        <div class="mode-transition__particles">
          @for (i of particles; track i) {
            <span class="mode-transition__particle" [style.--i]="i"></span>
          }
        </div>
      </div>
    }
  `
})
export class ModeSwitchComponent {
  modeService = inject(AppModeService);
  private router = inject(Router);

  visible = false;
  particles = Array.from({ length: 12 }, (_, i) => i);

  constructor() {
    this.updateVisible(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      this.updateVisible((e as NavigationEnd).urlAfterRedirects);
    });
  }

  select(mode: AppMode): void {
    this.modeService.switchTo(mode);
  }

  private updateVisible(url: string): void {
    this.visible = this.modeService.showModeSwitch(url);
  }
}
