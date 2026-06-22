import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KnowledgeChatRequest, KnowledgeChatResponse } from '../models/knowledge';

@Injectable({ providedIn: 'root' })
export class KnowledgeChatService {
  private http = inject(HttpClient);

  chat(knowledgeBaseId: number, req: KnowledgeChatRequest): Observable<KnowledgeChatResponse> {
    return this.http.post<KnowledgeChatResponse>(
      `${environment.apiUrl}/knowledge-bases/${knowledgeBaseId}/chat`,
      req
    );
  }
}
