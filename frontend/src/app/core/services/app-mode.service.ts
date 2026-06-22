import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

export type AppMode = 'chat' | 'knowledge' | 'ide';

const MODE_PATHS: Record<AppMode, string> = {
  chat: '/chat',
  knowledge: '/knowledge',
  ide: '/workspaces'
};

const MODE_LABELS: Record<AppMode, string> = {
  chat: '💬 Chat Mode',
  knowledge: '🧠 Knowledge Mode',
  ide: '💻 IDE Mode'
};

@Injectable({ providedIn: 'root' })
export class AppModeService {
  private router = inject(Router);

  readonly mode = signal<AppMode>('chat');
  readonly transitioning = signal(false);
  readonly transitionLabel = signal('');
  readonly transitionTarget = signal<AppMode>('chat');

  constructor() {
    this.syncFromUrl(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      this.syncFromUrl((e as NavigationEnd).urlAfterRedirects);
    });
  }

  isIdeRoute(url: string): boolean {
    const path = url.split('?')[0];
    return path.startsWith('/workspaces') || path.startsWith('/projects') || path.startsWith('/plugins');
  }

  isKnowledgeRoute(url: string): boolean {
    return url.split('?')[0].startsWith('/knowledge');
  }

  isKnowledgeChatRoute(url: string): boolean {
    return /^\/knowledge\/\d+\/chat/.test(url.split('?')[0]);
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
    if (this.isKnowledgeChatRoute(path)) return false;
    return path === '/chat'
      || path.startsWith('/workspaces')
      || path.startsWith('/plugins')
      || path === '/knowledge'
      || path === '/knowledge/create'
      || /^\/knowledge\/\d+(\/(documents|settings|analytics)?)?$/.test(path);
  }

  switchTo(target: AppMode): void {
    if (this.transitioning()) return;
    const current = this.mode();
    if (current === target) return;

    this.transitionTarget.set(target);
    this.transitionLabel.set(MODE_LABELS[target]);
    this.transitioning.set(true);

    window.setTimeout(() => {
      this.router.navigateByUrl(MODE_PATHS[target]);
    }, 420);

    window.setTimeout(() => {
      this.transitioning.set(false);
      this.transitionLabel.set('');
    }, 1100);
  }

  private syncFromUrl(url: string): void {
    const path = url.split('?')[0];
    if (this.isIdeRoute(path)) {
      this.mode.set('ide');
    } else if (this.isKnowledgeRoute(path)) {
      this.mode.set('knowledge');
    } else {
      this.mode.set('chat');
    }
  }
}
