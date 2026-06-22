import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-knowledge-layout',
  imports: [RouterOutlet],
  template: `
    <div class="knowledge-mode-page">
      <main class="feature-main feature-main--scroll">
        <router-outlet />
      </main>
    </div>
  `
})
export class KnowledgeLayoutComponent {}
