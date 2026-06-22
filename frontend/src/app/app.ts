import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageLoadingOverlayComponent } from './shared/components/page-loading-overlay/page-loading-overlay.component';
import { ModeSwitchComponent } from './shared/components/mode-switch/mode-switch.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PageLoadingOverlayComponent, ModeSwitchComponent],
  template: `
    <app-mode-switch />
    <div class="app-viewport">
      <router-outlet />
    </div>
    <app-page-loading-overlay />
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .app-viewport {
      height: 100%;
      animation: appViewportIn 0.35s ease;
    }
    @keyframes appViewportIn {
      from { opacity: 0.85; }
      to { opacity: 1; }
    }
  `]
})
export class App {}
