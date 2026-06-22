import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KnowledgeDocument } from '../models/knowledge';

@Injectable({ providedIn: 'root' })
export class KnowledgeDocumentService {
  private http = inject(HttpClient);

  list(knowledgeBaseId: number): Observable<KnowledgeDocument[]> {
    return this.http.get<KnowledgeDocument[]>(
      `${environment.apiUrl}/knowledge-bases/${knowledgeBaseId}/documents`
    );
  }

  upload(knowledgeBaseId: number, file: File): Observable<KnowledgeDocument> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<KnowledgeDocument>(
      `${environment.apiUrl}/knowledge-bases/${knowledgeBaseId}/documents`,
      form
    );
  }

  delete(knowledgeBaseId: number, documentId: number): Observable<void> {
    return this.http.delete<void>(
      `${environment.apiUrl}/knowledge-bases/${knowledgeBaseId}/documents/${documentId}`
    );
  }
}
