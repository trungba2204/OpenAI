import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TerminalExecResponse, TerminalInfo } from '../models/ide';

@Injectable({ providedIn: 'root' })
export class TerminalService {
  private base = `${environment.apiUrl}/terminal`;

  constructor(private http: HttpClient) {}

  getInfo(projectId: number): Observable<TerminalInfo> {
    return this.http.get<TerminalInfo>(`${this.base}/${projectId}`);
  }

  exec(projectId: number, command: string, shell?: string): Observable<TerminalExecResponse> {
    return this.http.post<TerminalExecResponse>(`${this.base}/exec`, {
      projectId,
      command,
      shell: shell ?? 'auto'
    });
  }
}
