import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PluginDeviceCode, PluginSession, PluginUsageSummary } from '../models/plugin';

@Injectable({ providedIn: 'root' })
export class PluginService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/plugin`;

  createDeviceCode(): Observable<PluginDeviceCode> {
    return this.http.post<PluginDeviceCode>(`${this.base}/auth/device`, {});
  }

  getSessions(): Observable<PluginSession[]> {
    return this.http.get<PluginSession[]>(`${this.base}/sessions`);
  }

  getUsage(): Observable<PluginUsageSummary> {
    return this.http.get<PluginUsageSummary>(`${this.base}/usage`);
  }
}
