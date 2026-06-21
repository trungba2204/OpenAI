import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageLoadingOverlayComponent } from './shared/components/page-loading-overlay/page-loading-overlay.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PageLoadingOverlayComponent],
  template: `
    <router-outlet />
    <app-page-loading-overlay />
  `,
  styles: [`:host { display: block; height: 100%; }`]
})
export class App {}
