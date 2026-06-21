import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

function shouldShowLoading(url: string): boolean {
  return url.includes('/auth/login')
    || url.includes('/auth/register')
    || url.includes('/api/admin/');
}

function loadingMessage(url: string): string {
  if (url.includes('/auth/register')) {
    return 'Đang đăng ký...';
  }
  if (url.includes('/auth/login')) {
    return 'Đang đăng nhập...';
  }
  return 'Đang tải...';
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
