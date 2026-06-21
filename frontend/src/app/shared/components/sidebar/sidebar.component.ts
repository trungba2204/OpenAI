import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { Conversation } from '../../../core/models';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="chat-sidebar">
      <div class="chat-sidebar__top">
        <button type="button" class="chat-sidebar__new-btn" (click)="newChat.emit()">
          <span class="icon">+</span>
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      <div class="chat-sidebar__list">
        <p class="chat-sidebar__label">Gần đây</p>
        @for (conv of conversations(); track conv.id) {
          <div class="chat-sidebar__item-row" [class.active]="conv.id === activeId()">
            <button type="button"
              class="chat-sidebar__item"
              (click)="selectConversation.emit(conv.id)">
              {{ conv.title }}
            </button>
            <button type="button"
              class="chat-sidebar__delete"
              (click)="onDelete($event, conv.id)"
              title="Xóa cuộc trò chuyện"
              aria-label="Xóa cuộc trò chuyện">
              ✕
            </button>
          </div>
        }
        @if (conversations().length === 0) {
          <p class="chat-sidebar__empty">Chưa có cuộc trò chuyện</p>
        }
      </div>

      <nav class="chat-sidebar__nav">
        <a routerLink="/prompts" routerLinkActive="active" class="chat-sidebar__link">
          <span>📚</span> Prompt Library
        </a>
        <a routerLink="/documents" routerLinkActive="active" class="chat-sidebar__link">
          <span>📄</span> Documents
        </a>
        <a routerLink="/agent" routerLinkActive="active" class="chat-sidebar__link">
          <span>🤖</span> Agent
        </a>
        <a routerLink="/markdown" routerLinkActive="active" class="chat-sidebar__link">
          <span>📝</span> Markdown
        </a>
        <a routerLink="/ppt" routerLinkActive="active" class="chat-sidebar__link">
          <span>📊</span> PPT Generator
        </a>
      </nav>

      <div class="chat-sidebar__footer">
        <div class="chat-sidebar__user">
          <p class="name">{{ auth.currentUser()?.fullName }}</p>
          <p class="email">{{ auth.currentUser()?.email }}</p>
        </div>
        <div class="chat-sidebar__actions">
          <button type="button" class="chat-icon-btn" (click)="theme.toggle()" title="Đổi theme">
            {{ theme.isDark() ? '☀️' : '🌙' }}
          </button>
          <button type="button" class="chat-icon-btn" (click)="auth.logout()" title="Đăng xuất">
            ⏻
          </button>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);

  conversations = input<Conversation[]>([]);
  activeId = input<number | null>(null);
  newChat = output<void>();
  selectConversation = output<number>();
  deleteConversation = output<number>();

  onDelete(event: Event, id: number): void {
    event.stopPropagation();
    this.deleteConversation.emit(id);
  }
}
