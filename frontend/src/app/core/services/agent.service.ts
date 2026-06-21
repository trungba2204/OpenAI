import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AgentRun } from '../models';

@Injectable({ providedIn: 'root' })
export class AgentService {
  constructor(private http: HttpClient) {}

  getRuns(): Observable<AgentRun[]> {
    return this.http.get<AgentRun[]>(`${environment.apiUrl}/agent/runs`);
  }
}
