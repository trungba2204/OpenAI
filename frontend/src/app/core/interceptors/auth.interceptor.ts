import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  // Không gắn JWT cho API bên ngoài (Open VSX) — tránh lỗi CORS/preflight
  if (req.url.includes('open-vsx.org')) {
    return next(req);
  }

  const token = auth.getAccessToken();

  if (token && !req.url.includes('/auth/')) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(req).pipe(
    catchError(err => {
      if ((err.status === 401 || err.status === 403) && auth.getRefreshToken() && !req.url.includes('/auth/refresh')) {
        return auth.refreshToken().pipe(
          switchMap(() => {
            const newReq = req.clone({
              setHeaders: { Authorization: `Bearer ${auth.getAccessToken()}` }
            });
            return next(newReq);
          }),
          catchError(refreshErr => {
            auth.logoutLocal();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
