import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KnowledgeBase, KnowledgeBaseRequest } from '../models/knowledge';

@Injectable({ providedIn: 'root' })
export class KnowledgeBaseService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/knowledge-bases`;

  list(): Observable<KnowledgeBase[]> {
    return this.http.get<KnowledgeBase[]>(this.base);
  }

  get(id: number): Observable<KnowledgeBase> {
    return this.http.get<KnowledgeBase>(`${this.base}/${id}`);
  }

  create(req: KnowledgeBaseRequest): Observable<KnowledgeBase> {
    return this.http.post<KnowledgeBase>(this.base, req);
  }

  update(id: number, req: KnowledgeBaseRequest): Observable<KnowledgeBase> {
    return this.http.put<KnowledgeBase>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  updatePrompt(id: number, systemPrompt: string): Observable<KnowledgeBase> {
    return this.http.put<KnowledgeBase>(`${this.base}/${id}/prompt`, { systemPrompt });
  }
}
