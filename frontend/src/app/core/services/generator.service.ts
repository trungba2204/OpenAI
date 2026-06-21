import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GeneratorService {
  constructor(private http: HttpClient) {}

  generateMarkdown(source: string, content?: string, documentId?: number): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${environment.apiUrl}/generate/markdown`, {
      source, content, documentId
    });
  }

  downloadMarkdown(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/generate/markdown/${id}/download`, { responseType: 'blob' });
  }

  generatePpt(markdown?: string, requirement?: string): Observable<{ id: number }> {
    return this.http.post<{ id: number }>(`${environment.apiUrl}/generate/ppt`, { markdown, requirement });
  }

  downloadPpt(id: number): Observable<Blob> {
    return this.http.get(`${environment.apiUrl}/generate/ppt/${id}/download`, { responseType: 'blob' });
  }
}
