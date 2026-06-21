import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Workspace } from '../models/ide';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private base = `${environment.apiUrl}/workspaces`;

  constructor(private http: HttpClient) {}

  list(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(this.base);
  }

  get(id: number): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.base}/${id}`);
  }

  create(name: string): Observable<Workspace> {
    return this.http.post<Workspace>(this.base, { name });
  }

  update(id: number, name: string): Observable<Workspace> {
    return this.http.put<Workspace>(`${this.base}/${id}`, { name });
  }

  clone(id: number): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.base}/${id}/clone`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
