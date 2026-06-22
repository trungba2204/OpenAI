import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminConversation,
  AdminDashboard,
  AdminUsage,
  AdminUser,
  CostAnalytics,
  ModelStatistic,
  TokenAnalytics,
  UsageFilters,
  AdminPluginDashboard,
  AdminPluginUsage,
  AdminPluginSession,
  AdminPluginInstallation,
  PluginUsageFilters
} from '../models/admin';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<AdminDashboard> {
    return this.http.get<AdminDashboard>(`${this.base}/dashboard`);
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.base}/users`);
  }

  getUser(id: number): Observable<AdminUser> {
    return this.http.get<AdminUser>(`${this.base}/users/${id}`);
  }

  lockUser(id: number): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.base}/users/${id}/lock`, {});
  }

  unlockUser(id: number): Observable<AdminUser> {
    return this.http.put<AdminUser>(`${this.base}/users/${id}/unlock`, {});
  }

  getUsages(filters: UsageFilters = {}): Observable<AdminUsage[]> {
    let params = new HttpParams();
    if (filters.model) params = params.set('model', filters.model);
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<AdminUsage[]>(`${this.base}/usages`, { params });
  }

  getUsage(id: number): Observable<AdminUsage> {
    return this.http.get<AdminUsage>(`${this.base}/usages/${id}`);
  }

  getConversations(keyword?: string): Observable<AdminConversation[]> {
    let params = new HttpParams();
    if (keyword?.trim()) params = params.set('keyword', keyword.trim());
    return this.http.get<AdminConversation[]>(`${this.base}/conversations`, { params });
  }

  getModelStatistics(): Observable<ModelStatistic[]> {
    return this.http.get<ModelStatistic[]>(`${this.base}/models/statistics`);
  }

  getTokenAnalytics(): Observable<TokenAnalytics> {
    return this.http.get<TokenAnalytics>(`${this.base}/analytics/tokens`);
  }

  getCostAnalytics(): Observable<CostAnalytics> {
    return this.http.get<CostAnalytics>(`${this.base}/analytics/cost`);
  }

  getPluginDashboard(): Observable<AdminPluginDashboard> {
    return this.http.get<AdminPluginDashboard>(`${this.base}/plugins/dashboard`);
  }

  getPluginUsages(filters: PluginUsageFilters = {}): Observable<AdminPluginUsage[]> {
    let params = new HttpParams();
    if (filters.editorType) params = params.set('editorType', filters.editorType);
    if (filters.userId) params = params.set('userId', filters.userId);
    if (filters.endpoint) params = params.set('endpoint', filters.endpoint);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<AdminPluginUsage[]>(`${this.base}/plugins/usages`, { params });
  }

  getPluginSessions(): Observable<AdminPluginSession[]> {
    return this.http.get<AdminPluginSession[]>(`${this.base}/plugins/sessions`);
  }

  getPluginInstallations(): Observable<AdminPluginInstallation[]> {
    return this.http.get<AdminPluginInstallation[]>(`${this.base}/plugins/installations`);
  }
}
