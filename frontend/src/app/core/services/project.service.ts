import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FileContent, FileTreeNode, Project } from '../models/ide';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private base = `${environment.apiUrl}/projects`;

  constructor(private http: HttpClient) {}

  list(workspaceId?: number): Observable<Project[]> {
    const url = workspaceId ? `${this.base}?workspaceId=${workspaceId}` : this.base;
    return this.http.get<Project[]>(url);
  }

  get(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.base}/${id}`);
  }

  create(workspaceId: number, name: string, description?: string): Observable<Project> {
    return this.http.post<Project>(this.base, { workspaceId, name, description });
  }

  uploadZip(workspaceId: number, file: File, name?: string): Observable<Project> {
    const form = new FormData();
    form.append('file', file);
    form.append('workspaceId', String(workspaceId));
    if (name) form.append('name', name);
    return this.http.post<Project>(`${this.base}/upload`, form);
  }

  importFolder(workspaceId: number, files: File[], name?: string): Observable<Project> {
    const form = new FormData();
    form.append('workspaceId', String(workspaceId));
    if (name) form.append('name', name);
    for (const file of files) {
      const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
      // Đường dẫn tương đối gắn vào tên file multipart — backend đọc từ getOriginalFilename()
      form.append('files', file, rel);
    }
    return this.http.post<Project>(`${this.base}/import-folder`, form);
  }

  rename(id: number, name: string): Observable<Project> {
    return this.http.put<Project>(`${this.base}/${id}`, { name });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getTree(projectId: number): Observable<FileTreeNode[]> {
    return this.http.get<FileTreeNode[]>(`${this.base}/${projectId}/tree`);
  }

  getFileContent(fileId: number): Observable<FileContent> {
    return this.http.get<FileContent>(`${environment.apiUrl}/files/${fileId}`);
  }

  saveFile(fileId: number, content: string): Observable<FileContent> {
    return this.http.put<FileContent>(`${environment.apiUrl}/files/${fileId}`, { content });
  }

  createFile(projectId: number, parentId: number | null, name: string, directory: boolean, content?: string): Observable<FileTreeNode> {
    return this.http.post<FileTreeNode>(`${environment.apiUrl}/files`, {
      projectId, parentId, name, directory, content
    });
  }

  deleteFile(fileId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/files/${fileId}`);
  }

  indexProject(projectId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.base}/${projectId}/index`, {});
  }
}
