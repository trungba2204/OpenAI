import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PluginConnectionStatus, PluginDeviceCode, PluginDeviceCodeStatusResponse, PluginSession, PluginUsageSummary } from '../models/plugin';

@Injectable({ providedIn: 'root' })
export class PluginService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/plugin`;
  private readonly connectionRefresh = new Subject<void>();
  readonly connectionRefresh$ = this.connectionRefresh.asObservable();

  notifyConnectionChanged(): void {
    this.connectionRefresh.next();
  }

  createDeviceCode(): Observable<PluginDeviceCode> {
    return this.http.post<PluginDeviceCode>(`${this.base}/auth/device`, {});
  }

  getDeviceCodeStatus(code: string): Observable<PluginDeviceCodeStatusResponse> {
    return this.http.get<PluginDeviceCodeStatusResponse>(`${this.base}/auth/device/status`, {
      params: { code }
    });
  }

  getConnectionStatus(): Observable<PluginConnectionStatus> {
    return this.http.get<PluginConnectionStatus>(`${this.base}/connection`);
  }

  getSessions(): Observable<PluginSession[]> {
    return this.http.get<PluginSession[]>(`${this.base}/sessions`);
  }

  getUsage(): Observable<PluginUsageSummary> {
    return this.http.get<PluginUsageSummary>(`${this.base}/usage`);
  }
}
