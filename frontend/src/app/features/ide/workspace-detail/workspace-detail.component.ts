import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { ProjectService } from '../../../core/services/project.service';
import { Workspace, Project } from '../../../core/models/ide';

@Component({
  selector: 'app-workspace-detail',
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <div class="ide-mode-page">
      <main class="feature-main feature-main--scroll">
        <div class="feature-container">
          <div class="feature-header">
            <div>
              <a routerLink="/workspaces" class="admin-link">← Workspaces</a>
              <h1 class="feature-title">{{ workspace()?.name ?? 'Workspace' }}</h1>
              <p class="feature-desc">Quản lý project trong workspace</p>
            </div>
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
              <label class="feature-btn feature-btn--sm feature-btn--primary">
                📂 Mở thư mục
                <input type="file" webkitdirectory directory multiple hidden (change)="onFolderSelected($event)" />
              </label>
              <button type="button" class="feature-btn feature-btn--sm" (click)="showForm = !showForm">+ Project mới</button>
            </div>
          </div>

          @if (showForm) {
            <div class="feature-form-card">
              <input [(ngModel)]="projectName" placeholder="Tên project" class="feature-input" />
              <button type="button" class="feature-btn feature-btn--primary feature-btn--sm" (click)="createProject()">Tạo</button>
            </div>
          }

          @if (importing()) {
            <p class="feature-empty">Đang import thư mục ({{ importCount() }} file)...</p>
          }
          @if (importError()) {
            <p class="feature-empty" style="color:#dc2626">{{ importError() }}</p>
          }

          <div class="ide-project-list">
            @for (p of projects(); track p.id) {
              <div class="ide-project-row">
                <div>
                  <a [routerLink]="['/projects', p.id]">{{ p.name }}</a>
                  <p style="margin:0.25rem 0 0;font-size:0.8125rem;color:var(--text-secondary)">
                    {{ p.description || 'No description' }} · {{ p.updatedAt | date:'short' }}
                  </p>
                </div>
                <button type="button" class="feature-btn feature-btn--danger feature-btn--sm" (click)="deleteProject(p.id)">Xóa</button>
              </div>
            }
          </div>

          @if (projects().length === 0 && !importing()) {
            <p class="feature-empty">Chưa có project. Mở thư mục từ máy hoặc tạo project mới.</p>
          }
        </div>
      </main>
    </div>
  `
})
export class WorkspaceDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workspaceService = inject(WorkspaceService);
  private projectService = inject(ProjectService);

  workspace = signal<Workspace | null>(null);
  projects = signal<Project[]>([]);
  importing = signal(false);
  importCount = signal(0);
  importError = signal('');
  showForm = false;
  projectName = '';
  workspaceId = 0;

  ngOnInit(): void {
    this.workspaceId = Number(this.route.snapshot.paramMap.get('id'));
    this.workspaceService.get(this.workspaceId).subscribe(w => this.workspace.set(w));
    this.loadProjects();
  }

  loadProjects(): void {
    this.projectService.list(this.workspaceId).subscribe(p => this.projects.set(p));
  }

  createProject(): void {
    const name = this.projectName.trim();
    if (!name) return;
    this.projectService.create(this.workspaceId, name).subscribe({
      next: () => { this.projectName = ''; this.showForm = false; this.loadProjects(); }
    });
  }

  onFolderSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!files.length) return;

    const folderName = this.deriveFolderName(files);
    this.importing.set(true);
    this.importError.set('');
    this.importCount.set(files.length);
    this.projectService.importFolder(this.workspaceId, files, folderName).subscribe({
      next: project => {
        this.importing.set(false);
        this.importCount.set(0);
        this.importError.set('');
        this.loadProjects();
        this.router.navigate(['/projects', project.id]);
      },
      error: err => {
        this.importing.set(false);
        this.importCount.set(0);
        const msg = err?.error?.message || err?.message || 'Import thất bại';
        this.importError.set(`${msg}. Nếu vẫn lỗi, hãy restart backend (./mvnw spring-boot:run).`);
      }
    });
  }

  private deriveFolderName(files: File[]): string | undefined {
    const first = (files[0] as File & { webkitRelativePath?: string }).webkitRelativePath;
    if (!first) return undefined;
    const slash = first.indexOf('/');
    return slash > 0 ? first.substring(0, slash) : undefined;
  }

  deleteProject(id: number): void {
    if (!confirm('Xóa project này?')) return;
    this.projectService.delete(id).subscribe(() => this.loadProjects());
  }
}
