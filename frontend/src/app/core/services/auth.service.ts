import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<User | null>(null);
  readonly isAdmin = computed(() => {
    const roles = this.normalizeRoles(this.currentUser()?.roles);
    return roles.includes('ADMIN') && !roles.includes('USER');
  });

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored) as User;
      user.roles = this.normalizeRoles(user.roles);
      this.currentUser.set(user);
    }
    if (this.isLoggedIn()) {
      this.refreshCurrentUser().subscribe();
    }
  }

  register(email: string, password: string, fullName: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, { email, password, fullName })
      .pipe(tap(res => this.storeAuth(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap(res => this.storeAuth(res)));
  }

  loginAdmin(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/admin/auth/login`, { email, password })
      .pipe(tap(res => this.storeAuth(res)));
  }

  refreshToken(): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {
      refreshToken: this.getRefreshToken()
    }).pipe(tap(res => this.storeAuth(res)));
  }

  refreshCurrentUser(): Observable<User | null> {
    if (!this.isLoggedIn()) return of(null);
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => this.updateUser(user)),
      catchError(() => of(this.currentUser()))
    );
  }

  logout(): void {
    const rt = this.getRefreshToken();
    if (rt) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken: rt }).subscribe();
    }
    this.logoutLocal('/login');
  }

  logoutAdmin(): void {
    const rt = this.getRefreshToken();
    if (rt) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken: rt }).subscribe();
    }
    this.logoutLocal('/admin/login');
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  logoutLocal(redirectTo = '/login'): void {
    this.clearSession();
    this.router.navigate([redirectTo]);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  private storeAuth(res: AuthResponse): void {
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
    this.updateUser(res.user);
  }

  private updateUser(user: User): void {
    const normalized = { ...user, roles: this.normalizeRoles(user.roles) };
    localStorage.setItem('user', JSON.stringify(normalized));
    this.currentUser.set(normalized);
  }

  private normalizeRoles(roles: unknown): string[] {
    if (!roles) return [];
    if (Array.isArray(roles)) return roles;
    if (typeof roles === 'object') return Object.values(roles as Record<string, string>);
    return [];
  }
}
