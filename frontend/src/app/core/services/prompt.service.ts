import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PromptTemplate } from '../models';

@Injectable({ providedIn: 'root' })
export class PromptService {
  constructor(private http: HttpClient) {}

  list(): Observable<PromptTemplate[]> {
    return this.http.get<PromptTemplate[]>(`${environment.apiUrl}/prompts`);
  }

  create(data: Partial<PromptTemplate>): Observable<PromptTemplate> {
    return this.http.post<PromptTemplate>(`${environment.apiUrl}/prompts`, data);
  }

  update(id: number, data: Partial<PromptTemplate>): Observable<PromptTemplate> {
    return this.http.put<PromptTemplate>(`${environment.apiUrl}/prompts/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/prompts/${id}`);
  }
}
