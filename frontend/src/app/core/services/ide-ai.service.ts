import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiModel } from '../models';
import {
  ContextScope,
  IdeAgentResponse,
  IdeChatResponse,
  IdeMultiEditResponse,
  IdeSearchResponse,
  IdeSelectionContext,
  InlineAction
} from '../models/ide';

@Injectable({ providedIn: 'root' })
export class IdeAiService {
  private base = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  private withModel(body: Record<string, unknown>, model?: AiModel): Record<string, unknown> {
    return model ? { ...body, model } : body;
  }

  chat(
    projectId: number,
    fileId: number | null,
    message: string,
    contextScope: ContextScope = 'PROJECT',
    model?: AiModel
  ): Observable<IdeChatResponse> {
    return this.http.post<IdeChatResponse>(`${this.base}/chat`, this.withModel({
      projectId, fileId, message, contextScope
    }, model));
  }

  inline(
    projectId: number,
    fileId: number | null,
    selectedCode: string,
    action: InlineAction,
    model?: AiModel,
    selection?: Pick<IdeSelectionContext, 'startLine' | 'endLine' | 'filePath'>
  ): Observable<IdeChatResponse> {
    return this.http.post<IdeChatResponse>(`${this.base}/inline`, this.withModel({
      projectId,
      fileId,
      selectedCode,
      action,
      ...(selection ? {
        startLine: selection.startLine,
        endLine: selection.endLine,
        selectedFilePath: selection.filePath
      } : {})
    }, model));
  }

  generate(projectId: number, fileId: number | null, prompt: string, model?: AiModel): Observable<IdeChatResponse> {
    return this.http.post<IdeChatResponse>(`${this.base}/generate`, this.withModel({ projectId, fileId, prompt }, model));
  }

  refactor(projectId: number, fileId: number | null, prompt: string, model?: AiModel): Observable<IdeChatResponse> {
    return this.http.post<IdeChatResponse>(`${this.base}/refactor`, this.withModel({ projectId, fileId, prompt }, model));
  }

  multiEdit(projectId: number, fileId: number | null, prompt: string, model?: AiModel): Observable<IdeMultiEditResponse> {
    return this.http.post<IdeMultiEditResponse>(`${this.base}/multi-edit`, this.withModel({ projectId, fileId, prompt }, model));
  }

  autoFix(
    projectId: number,
    fileId: number | null,
    message: string,
    contextScope: ContextScope = 'PROJECT',
    model?: AiModel,
    selection?: IdeSelectionContext
  ): Observable<IdeMultiEditResponse> {
    return this.http.post<IdeMultiEditResponse>(`${this.base}/auto-fix`, this.withModel({
      projectId,
      fileId,
      message,
      contextScope,
      ...(selection ? {
        startLine: selection.startLine,
        endLine: selection.endLine,
        selectedCode: selection.selectedCode,
        selectedFilePath: selection.filePath
      } : {})
    }, model));
  }

  search(projectId: number, q: string, model?: AiModel): Observable<IdeSearchResponse> {
    let params = new HttpParams().set('projectId', projectId).set('q', q);
    if (model) params = params.set('model', model);
    return this.http.get<IdeSearchResponse>(`${this.base}/search`, { params });
  }

  review(projectId: number, fileId: number | null, prompt: string, model?: AiModel): Observable<IdeChatResponse> {
    return this.http.post<IdeChatResponse>(`${this.base}/review`, this.withModel({ projectId, fileId, prompt }, model));
  }

  architecture(projectId: number, model?: AiModel): Observable<IdeChatResponse> {
    let params = new HttpParams().set('projectId', projectId);
    if (model) params = params.set('model', model);
    return this.http.get<IdeChatResponse>(`${this.base}/architecture`, { params });
  }

  agent(projectId: number, fileId: number | null, prompt: string, model?: AiModel): Observable<IdeAgentResponse> {
    return this.http.post<IdeAgentResponse>(`${this.base}/agent`, this.withModel({ projectId, fileId, prompt }, model));
  }

  commitMessage(projectId: number, summary?: string, model?: AiModel): Observable<IdeChatResponse> {
    return this.http.post<IdeChatResponse>(`${this.base}/commit-message`, this.withModel({ projectId, summary }, model));
  }
}
