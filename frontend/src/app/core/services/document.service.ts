import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DocumentItem } from '../models';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  constructor(private http: HttpClient) {}

  list(): Observable<DocumentItem[]> {
    return this.http.get<DocumentItem[]>(`${environment.apiUrl}/documents`);
  }

  upload(file: File, conversationId?: number): Observable<DocumentItem> {
    const form = new FormData();
    form.append('file', file);
    let url = `${environment.apiUrl}/documents/upload`;
    if (conversationId) url += `?conversationId=${conversationId}`;
    return this.http.post<DocumentItem>(url, form);
  }
}
