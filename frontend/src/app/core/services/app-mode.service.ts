import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export type AppMode = 'chat' | 'ide';

@Injectable({ providedIn: 'root' })
export class AppModeService {
  private router = inject(Router);

  readonly mode = signal<AppMode>('chat');
  readonly transitioning = signal(false);
  readonly transitionLabel = signal('');

  constructor() {
    this.syncFromUrl(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      this.syncFromUrl((e as NavigationEnd).urlAfterRedirects);
    });
  }

  isIdeRoute(url: string): boolean {
    return url.startsWith('/workspaces') || url.startsWith('/projects');
  }

  isPublicRoute(url: string): boolean {
    return url.startsWith('/login')
      || url.startsWith('/register')
      || url.startsWith('/admin');
  }

  showModeSwitch(url = this.router.url): boolean {
    const path = url.split('?')[0];
    if (this.isPublicRoute(path)) return false;
    if (path.startsWith('/projects/')) return false;
    return path === '/chat' || path === '/workspaces' || path.startsWith('/workspaces/');
  }

  switchTo(target: AppMode): void {
    if (this.transitioning()) return;
    const current = this.mode();
    if (current === target) return;

    this.transitionLabel.set(target === 'ide' ? '💻 IDE Mode' : '💬 Chat Mode');
    this.transitioning.set(true);

    const path = target === 'ide' ? '/workspaces' : '/chat';

    window.setTimeout(() => {
      this.router.navigateByUrl(path);
    }, 420);

    window.setTimeout(() => {
      this.transitioning.set(false);
      this.transitionLabel.set('');
    }, 1100);
  }

  private syncFromUrl(url: string): void {
    const path = url.split('?')[0];
    this.mode.set(this.isIdeRoute(path) ? 'ide' : 'chat');
  }
}
