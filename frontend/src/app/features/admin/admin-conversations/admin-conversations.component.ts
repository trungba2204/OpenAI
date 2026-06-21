import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminConversation } from '../../../core/models/admin';

@Component({
  selector: 'app-admin-conversations',
  imports: [DatePipe, DecimalPipe, FormsModule],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <div>
          <h1 class="admin-title">Conversations</h1>
          <p class="admin-desc">Giám sát cuộc hội thoại</p>
        </div>
      </div>

      <div class="admin-filters">
        <label style="flex:1; min-width:12rem">
          Tìm kiếm
          <input [(ngModel)]="keyword" placeholder="keyword, email, title..." (keyup.enter)="load()" />
        </label>
        <button type="button" class="feature-btn feature-btn--primary" (click)="load()">Tìm</button>
      </div>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Title</th>
              <th>Question</th>
              <th>Answer</th>
              <th>Model</th>
              <th>Tokens</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            @for (c of conversations(); track c.id) {
              <tr>
                <td>{{ c.userEmail }}</td>
                <td class="admin-table__cell-clip">{{ c.title }}</td>
                <td class="admin-table__cell-clip" [title]="c.question">{{ c.question }}</td>
                <td class="admin-table__cell-clip" [title]="c.answer">{{ c.answer }}</td>
                <td>{{ c.model }}</td>
                <td>{{ c.tokens | number }}</td>
                <td>{{ c.updatedAt | date:'short' }}</td>
              </tr>
            }
          </tbody>
        </table>
        @if (conversations().length === 0 && !loading()) {
          <p class="admin-empty">Không có conversation</p>
        }
      </div>
    </div>
  `
})
export class AdminConversationsComponent implements OnInit {
  private admin = inject(AdminService);

  conversations = signal<AdminConversation[]>([]);
  loading = signal(true);
  keyword = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.admin.getConversations(this.keyword).subscribe({
      next: c => { this.conversations.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
