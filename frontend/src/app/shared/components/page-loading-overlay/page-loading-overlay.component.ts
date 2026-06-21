import { Component, inject } from '@angular/core';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-page-loading-overlay',
  template: `
    @if (loading.visible()) {
      <div class="app-loading-overlay" role="status" aria-live="polite" aria-busy="true">
        <div class="app-loading-card">
          <div class="app-loading-spinner" aria-hidden="true"></div>
          <p class="app-loading-text">{{ loading.message() }}</p>
          <div class="app-loading-bar" aria-hidden="true">
            <span></span>
          </div>
        </div>
      </div>
    }
  `
})
export class PageLoadingOverlayComponent {
  loading = inject(LoadingService);
}
