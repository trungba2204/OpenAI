import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { PromptService } from '../../../core/services/prompt.service';
import { ChatService } from '../../../core/services/chat.service';
import { PromptTemplate } from '../../../core/models';

@Component({
  selector: 'app-prompt-library',
  imports: [FormsModule, SidebarComponent],
  template: `
    <div class="feature-layout">
      <app-sidebar [conversations]="[]" [activeId]="null" (newChat)="goChat()" (selectConversation)="goChat()" />

      <main class="feature-main feature-main--scroll">
        <div class="feature-container">
          <div class="feature-header">
            <h1 class="feature-title">📚 Prompt Library</h1>
            <button type="button" class="feature-btn feature-btn--primary" (click)="showForm = !showForm">
              + Tạo prompt
            </button>
          </div>

          @if (showForm) {
            <div class="feature-form-card">
              <input [(ngModel)]="form.title" placeholder="Tiêu đề" class="feature-input" />
              <textarea [(ngModel)]="form.content" placeholder="Nội dung prompt" rows="4" class="feature-textarea"></textarea>
              <input [(ngModel)]="form.category" placeholder="Category (CODE, TEST, ...)" class="feature-input" />
              <button type="button" (click)="savePrompt()" class="feature-btn feature-btn--primary feature-btn--sm">Lưu</button>
            </div>
          }

          <div class="feature-card-grid">
            @for (p of prompts(); track p.id) {
              <div class="feature-card" (click)="usePrompt(p)">
                <div class="feature-card__head">
                  <span class="feature-badge">{{ p.category }}</span>
                  @if (p.owned) {
                    <button type="button" (click)="deletePrompt(p.id, $event)" class="feature-card__delete">✕</button>
                  }
                </div>
                <h3 class="feature-card__title">{{ p.title }}</h3>
                <p class="feature-card__body">{{ p.content }}</p>
              </div>
            }
          </div>

          @if (prompts().length === 0 && !showForm) {
            <p class="feature-empty">Chưa có prompt nào. Tạo prompt mới hoặc dùng prompt có sẵn từ hệ thống.</p>
          }
        </div>
      </main>
    </div>
  `
})
export class PromptLibraryComponent implements OnInit {
  private promptService = inject(PromptService);
  private chatService = inject(ChatService);
  private router = inject(Router);

  prompts = signal<PromptTemplate[]>([]);
  showForm = false;
  form = { title: '', content: '', category: 'GENERAL' };

  ngOnInit(): void {
    this.promptService.list().subscribe(p => this.prompts.set(p));
  }

  usePrompt(p: PromptTemplate): void {
    this.chatService.pendingPrompt.set(p.content);
    this.goChat();
  }

  savePrompt(): void {
    this.promptService.create({ ...this.form, isPublic: false }).subscribe(() => {
      this.promptService.list().subscribe(p => this.prompts.set(p));
      this.showForm = false;
      this.form = { title: '', content: '', category: 'GENERAL' };
    });
  }

  deletePrompt(id: number, event: Event): void {
    event.stopPropagation();
    this.promptService.delete(id).subscribe(() => {
      this.prompts.update(list => list.filter(p => p.id !== id));
    });
  }

  goChat(): void {
    this.router.navigate(['/chat']);
  }
}
