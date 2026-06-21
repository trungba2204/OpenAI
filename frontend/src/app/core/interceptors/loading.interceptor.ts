import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

function shouldShowLoading(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/auth/register');
}

function loadingMessage(url: string): string {
  if (url.includes('/auth/register')) {
    return 'Đang đăng ký...';
  }
  return 'Đang đăng nhập...';
}

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!shouldShowLoading(req.url)) {
    return next(req);
  }

  const loading = inject(LoadingService);
  loading.start(loadingMessage(req.url));

  return next(req).pipe(
    finalize(() => loading.end())
  );
};
