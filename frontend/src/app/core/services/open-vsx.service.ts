import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OpenVsxSearchItem } from '../models/ide-extension';
import {
  mapApiExtension,
  openVsxLatestUrl,
  openVsxSearchUrl,
  OpenVsxExtensionMeta,
  parsePackageJsonManifest,
  toSearchItem
} from '../utils/vsix-parser';

interface SearchResponse {
  extensions?: Record<string, unknown>[];
}

@Injectable({ providedIn: 'root' })
export class OpenVsxService {
  search(query: string, size = 20): Observable<OpenVsxSearchItem[]> {
    const q = query.trim();
    return new Observable(subscriber => {
      if (!q) {
        subscriber.next([]);
        subscriber.complete();
        return;
      }

      this.fetchJson<SearchResponse>(openVsxSearchUrl(q, size))
        .then(res => {
          const items = (res.extensions ?? [])
            .map(item => mapApiExtension(item))
            .filter((item): item is OpenVsxExtensionMeta => item != null)
            .map(item => toSearchItem(item));
          subscriber.next(items);
          subscriber.complete();
        })
        .catch(err => subscriber.error(err));
    });
  }

  getLatest(namespace: string, name: string): Observable<OpenVsxSearchItem> {
    return new Observable(subscriber => {
      this.fetchJson<Record<string, unknown>>(openVsxLatestUrl(namespace, name))
        .then(async raw => {
          const meta = mapApiExtension(raw);
          if (!meta) throw new Error('Extension không hợp lệ');

          let item = toSearchItem(meta);
          if (meta.manifestUrl) {
            const text = await this.fetchText(meta.manifestUrl);
            const manifest = parsePackageJsonManifest(text);
            item = {
              ...item,
              displayName: manifest.displayName,
              description: manifest.description || item.description,
              publisher: manifest.publisher,
              version: manifest.version,
              languageIds: manifest.languageIds
            };
          }

          subscriber.next(item);
          subscriber.complete();
        })
        .catch(err => subscriber.error(err));
    });
  }

  downloadVsix(url: string, onProgress?: (percent: number) => void): Observable<ArrayBuffer> {
    return new Observable(subscriber => {
      fetch(url)
        .then(async response => {
          if (!response.ok) {
            throw new Error(`Tải VSIX thất bại (${response.status})`);
          }

          const total = Number(response.headers.get('content-length') ?? 0);
          const reader = response.body?.getReader();
          if (!reader) {
            subscriber.next(await response.arrayBuffer());
            subscriber.complete();
            return;
          }

          const chunks: Uint8Array[] = [];
          let loaded = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;
            if (total > 0 && onProgress) {
              onProgress(Math.min(99, Math.round((loaded / total) * 100)));
            }
          }

          const merged = new Uint8Array(loaded);
          let offset = 0;
          for (const chunk of chunks) {
            merged.set(chunk, offset);
            offset += chunk.length;
          }

          subscriber.next(merged.buffer);
          subscriber.complete();
        })
        .catch(err => subscriber.error(err));
    });
  }

  headContentLength(url: string): Observable<number> {
    return new Observable(subscriber => {
      fetch(url, { method: 'HEAD' })
        .then(res => {
          subscriber.next(Number(res.headers.get('content-length') ?? 0));
          subscriber.complete();
        })
        .catch(err => subscriber.error(err));
    });
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' }
    });
    if (!response.ok) {
      throw new Error(`Open VSX lỗi ${response.status}`);
    }
    return response.json() as Promise<T>;
  }

  private async fetchText(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Tải manifest thất bại (${response.status})`);
    }
    return response.text();
  }
}
