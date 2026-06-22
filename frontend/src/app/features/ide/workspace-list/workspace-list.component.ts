import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { Workspace } from '../../../core/models/ide';

@Component({
  selector: 'app-workspace-list',
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <div class="ide-mode-page">
      <main class="feature-main feature-main--scroll">
        <div class="feature-container">
          <div class="feature-header">
            <div>
              <h1 class="feature-title">💻 AI IDE Workspace</h1>
              <p class="feature-desc">Quản lý project, chỉnh sửa code và chat với AI</p>
            </div>
            <button type="button" class="feature-btn feature-btn--primary" (click)="showForm = !showForm">
              + Workspace mới
            </button>
          </div>

          @if (showForm) {
            <div class="feature-form-card">
              <input [(ngModel)]="newName" placeholder="Tên workspace" class="feature-input" />
              <button type="button" class="feature-btn feature-btn--primary feature-btn--sm" (click)="create()">Tạo</button>
            </div>
          }

          <div class="ide-workspace-grid">
            @for (w of workspaces(); track w.id) {
              <a class="ide-workspace-card" [routerLink]="['/workspaces', w.id]">
                <h3>{{ w.name }}</h3>
                <p>{{ w.projectCount }} project · Cập nhật {{ w.updatedAt | date:'short' }}</p>
              </a>
            }
          </div>

          @if (workspaces().length === 0 && !loading()) {
            <p class="feature-empty">Chưa có workspace. Tạo workspace mới để bắt đầu.</p>
          }
        </div>
      </main>
    </div>
  `
})
export class WorkspaceListComponent implements OnInit {
  private workspaceService = inject(WorkspaceService);
  private router = inject(Router);

  workspaces = signal<Workspace[]>([]);
  loading = signal(true);
  showForm = false;
  newName = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.workspaceService.list().subscribe({
      next: w => { this.workspaces.set(w); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  create(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.workspaceService.create(name).subscribe({
      next: () => { this.newName = ''; this.showForm = false; this.load(); }
    });
  }
}
