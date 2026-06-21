import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GitConnectRequest, GitConnection, GitRepoSuggest, GitStatus, GitSyncResponse } from '../models/ide';

@Injectable({ providedIn: 'root' })
export class GitService {
  private base = `${environment.apiUrl}/git`;

  constructor(private http: HttpClient) {}

  getConnection(projectId: number): Observable<GitConnection> {
    return this.http.get<GitConnection>(`${this.base}/${projectId}`);
  }

  getStatus(projectId: number): Observable<GitStatus> {
    return this.http.get<GitStatus>(`${this.base}/${projectId}/status`);
  }

  suggestRepo(projectId: number): Observable<GitRepoSuggest> {
    return this.http.get<GitRepoSuggest>(`${this.base}/${projectId}/suggest`);
  }

  connect(request: GitConnectRequest): Observable<GitConnection> {
    return this.http.post<GitConnection>(`${this.base}/connect`, request);
  }

  pull(projectId: number): Observable<GitSyncResponse> {
    return this.http.post<GitSyncResponse>(`${this.base}/pull`, { projectId });
  }

  push(projectId: number, commitMessage?: string): Observable<GitSyncResponse> {
    return this.http.post<GitSyncResponse>(`${this.base}/push`, { projectId, commitMessage });
  }
}
