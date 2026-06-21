import { Injectable, inject, signal, computed } from '@angular/core';
import type * as Monaco from 'monaco-editor';
import { Observable, Subject, firstValueFrom, from, of } from 'rxjs';
import {
  DEFAULT_INSTALLED,
  EXTENSION_BY_EXTENSION,
  EXTENSION_BY_ID,
  IDE_EXTENSION_CATALOG
} from '../data/ide-extensions.catalog';
import {
  IdeExtensionInfo,
  IdeExtensionSnippet,
  InstallProgress,
  OpenVsxSearchItem
} from '../models/ide-extension';
import { OpenVsxService } from './open-vsx.service';
import { MAX_VSIX_BYTES, parseVsixBuffer } from '../utils/vsix-parser';

const STORAGE_KEY = 'ide-installed-extensions';
const EXTERNAL_KEY = 'ide-external-extensions';
const DISMISSED_KEY = 'ide-extension-dismissed';
const SNIPPET_CACHE_KEY = 'ide-extension-snippets';

interface ExternalExtensionRecord {
  id: string;
  namespace: string;
  name: string;
  version: string;
  displayName: string;
  publisher: string;
  description: string;
  languageIds: string[];
  iconUrl?: string;
  snippets: IdeExtensionSnippet[];
}

@Injectable({ providedIn: 'root' })
export class IdeExtensionService {
  private openVsx = inject(OpenVsxService);
  private monaco: typeof Monaco | null = null;
  private disposables = new Map<string, Monaco.IDisposable[]>();
  private installing = new Set<string>();
  private snippetCache = this.loadSnippetCache();
  private externalExtensions = signal<ExternalExtensionRecord[]>(this.loadExternalExtensions());

  installedIds = signal<string[]>(this.loadInstalledIds());
  installProgress = signal<InstallProgress | null>(null);

  availableCount = computed(() =>
    this.getCatalog().filter(ext => !this.isInstalled(ext.id)).length
  );

  getCatalog(): IdeExtensionInfo[] {
    return IDE_EXTENSION_CATALOG.map(ext => ({
      ...ext,
      snippets: this.snippetCache[ext.id] ?? ext.snippets,
      version: this.getCachedMeta(ext.id)?.version ?? ext.version,
      iconUrl: this.getCachedMeta(ext.id)?.iconUrl ?? ext.iconUrl,
      publisher: this.getCachedMeta(ext.id)?.publisher ?? ext.publisher,
      source: ext.openVsx ? 'openvsx' as const : 'builtin' as const
    }));
  }

  getExternalExtensions(): ExternalExtensionRecord[] {
    return this.externalExtensions();
  }

  getById(id: string): IdeExtensionInfo | undefined {
    return this.getCatalog().find(e => e.id === id);
  }

  isInstalled(id: string): boolean {
    return this.installedIds().includes(id) || this.externalExtensions().some(e => e.id === id);
  }

  isInstalling(id: string): boolean {
    return this.installing.has(id);
  }

  setMonaco(monaco: typeof Monaco): void {
    this.monaco = monaco;
    for (const id of this.installedIds()) {
      const ext = this.getById(id);
      if (ext) this.applyExtension(ext.id, ext.languageId, ext.snippets);
    }
    for (const ext of this.externalExtensions()) {
      for (const lang of ext.languageIds) {
        this.applyExtension(ext.id, lang, ext.snippets);
      }
    }
  }

  resolveLanguage(filename: string): string {
    const lowerName = filename.toLowerCase();
    if (lowerName === 'dockerfile' || lowerName.endsWith('.dockerfile')) {
      const docker = this.getById('docker');
      if (docker && this.isInstalled(docker.id)) return docker.languageId;
      return 'dockerfile';
    }

    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    if (!ext) return 'plaintext';

    const extensionId = EXTENSION_BY_EXTENSION[ext];
    if (extensionId && this.isInstalled(extensionId)) {
      return this.getById(extensionId)?.languageId ?? 'plaintext';
    }

    const fallback: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      java: 'java', py: 'python', html: 'html', htm: 'html', css: 'css',
      scss: 'scss', json: 'json', md: 'markdown', sql: 'sql', yml: 'yaml',
      yaml: 'yaml', xml: 'xml', go: 'go', cs: 'csharp', rs: 'rust', vue: 'html'
    };
    return fallback[ext] ?? 'plaintext';
  }

  suggestForFile(filename: string): IdeExtensionInfo | null {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    if (!ext) return null;

    const lowerName = filename.toLowerCase();
    if (lowerName === 'dockerfile' || lowerName.endsWith('.dockerfile')) {
      const docker = this.getById('docker');
      return docker && !this.isInstalled(docker.id) ? docker : null;
    }

    const extensionId = EXTENSION_BY_EXTENSION[ext];
    if (!extensionId) return null;

    const info = this.getById(extensionId);
    if (!info || this.isInstalled(extensionId)) return null;
    if (this.isDismissed(extensionId)) return null;
    return info;
  }

  install(id: string): Observable<InstallProgress> {
    const ext = EXTENSION_BY_ID.get(id);
    if (!ext) {
      return of({ extensionId: id, phase: 'error', percent: 0, error: 'Extension không tồn tại' });
    }
    if (this.isInstalled(id)) {
      return of({ extensionId: id, phase: 'done', percent: 100 });
    }
    if (this.installing.has(id)) {
      return of({ extensionId: id, phase: 'installing', percent: 50 });
    }

    return this.runInstall(id, async progress => {
      let snippets = [...ext.snippets];
      let meta: Partial<IdeExtensionInfo> = {};

      if (ext.openVsx) {
        const remote = await firstValueFrom(
          this.openVsx.getLatest(ext.openVsx.namespace, ext.openVsx.name)
        );
        meta = {
          version: remote.version,
          publisher: remote.publisher,
          iconUrl: remote.iconUrl,
          description: remote.description || ext.description
        };

        progress({ phase: 'downloading', percent: 10, message: 'Đang kiểm tra Open VSX...' });

        const size = await firstValueFrom(this.openVsx.headContentLength(remote.downloadUrl));
        if (size > 0 && size <= MAX_VSIX_BYTES) {
          progress({ phase: 'downloading', percent: 20, message: 'Đang tải VSIX từ Open VSX...' });
          const buffer = await firstValueFrom(
            this.openVsx.downloadVsix(remote.downloadUrl, percent => {
              progress({
                phase: 'downloading',
                percent: 20 + Math.round(percent * 0.55),
                message: 'Đang tải VSIX...'
              });
            })
          );
          progress({ phase: 'installing', percent: 82, message: 'Đang trích xuất snippets...' });
          const parsed = await parseVsixBuffer(buffer);
          if (parsed.snippets.length) snippets = parsed.snippets;
        } else if (size > MAX_VSIX_BYTES) {
          progress({
            phase: 'installing',
            percent: 70,
            message: 'Extension lớn — dùng highlight tích hợp + snippets sẵn có'
          });
        }
      } else {
        progress({ phase: 'downloading', percent: 40, message: 'Đang tải bundle...' });
        await this.delay(300);
      }

      progress({ phase: 'installing', percent: 90, message: 'Đang kích hoạt trong editor...' });
      this.cacheSnippets(id, snippets, meta);
      this.applyExtension(id, ext.languageId, snippets);

      const ids = [...new Set([...this.installedIds(), id])];
      this.installedIds.set(ids);
      this.saveInstalledIds(ids);
    });
  }

  installMarketplace(item: OpenVsxSearchItem): Observable<InstallProgress> {
    if (this.isInstalled(item.id)) {
      return of({ extensionId: item.id, phase: 'done', percent: 100 });
    }
    if (this.installing.has(item.id)) {
      return of({ extensionId: item.id, phase: 'installing', percent: 50 });
    }

    return this.runInstall(item.id, async progress => {
      progress({ phase: 'downloading', percent: 8, message: 'Đang lấy metadata Open VSX...' });
      const latest = await firstValueFrom(this.openVsx.getLatest(item.namespace, item.name));

      const size = await firstValueFrom(this.openVsx.headContentLength(latest.downloadUrl));
      if (size > MAX_VSIX_BYTES) {
        throw new Error(`Extension quá lớn (${this.formatBytes(size)}). Giới hạn ${this.formatBytes(MAX_VSIX_BYTES)}.`);
      }

      progress({ phase: 'downloading', percent: 15, message: 'Đang tải VSIX...' });
      const buffer = await firstValueFrom(
        this.openVsx.downloadVsix(latest.downloadUrl, percent => {
          progress({
            phase: 'downloading',
            percent: 15 + Math.round(percent * 0.6),
            message: 'Đang tải VSIX...'
          });
        })
      );

      progress({ phase: 'installing', percent: 82, message: 'Đang trích xuất...' });
      const parsed = await parseVsixBuffer(buffer);
      const languageIds = parsed.languageIds.length ? parsed.languageIds : latest.languageIds;

      const record: ExternalExtensionRecord = {
        id: item.id,
        namespace: item.namespace,
        name: item.name,
        version: parsed.version || latest.version,
        displayName: parsed.displayName || latest.displayName,
        publisher: parsed.publisher || latest.publisher,
        description: parsed.description || latest.description,
        languageIds,
        iconUrl: latest.iconUrl,
        snippets: parsed.snippets
      };

      progress({ phase: 'installing', percent: 92, message: 'Đang kích hoạt...' });
      const list = [...this.externalExtensions().filter(e => e.id !== item.id), record];
      this.externalExtensions.set(list);
      this.saveExternalExtensions(list);

      for (const lang of languageIds) {
        this.applyExtension(item.id, lang, parsed.snippets);
      }
    });
  }

  uninstall(id: string): void {
    if (DEFAULT_INSTALLED.includes(id)) return;

    for (const [key, disposables] of [...this.disposables.entries()]) {
      if (key === id || key.startsWith(`${id}:`)) {
        for (const d of disposables) d.dispose();
        this.disposables.delete(key);
      }
    }

    if (id.startsWith('vsx:')) {
      const list = this.externalExtensions().filter(e => e.id !== id);
      this.externalExtensions.set(list);
      this.saveExternalExtensions(list);
      return;
    }

    const ids = this.installedIds().filter(x => x !== id);
    this.installedIds.set(ids);
    this.saveInstalledIds(ids);
    delete this.snippetCache[id];
    this.saveSnippetCache();
  }

  dismissSuggestion(id: string): void {
    const dismissed = this.loadDismissed();
    dismissed.add(id);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
  }

  formatSize(kb: number): string {
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${kb} KB`;
  }

  formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  }

  private runInstall(
    id: string,
    task: (progress: (p: Omit<InstallProgress, 'extensionId'>) => void) => Promise<void>
  ): Observable<InstallProgress> {
    this.installing.add(id);
    const progress$ = new Subject<InstallProgress>();

    const emit = (partial: Omit<InstallProgress, 'extensionId'>) => {
      const value: InstallProgress = { extensionId: id, ...partial };
      this.installProgress.set(value);
      progress$.next(value);
    };

    from(task(emit)).subscribe({
      next: () => {
        const done: InstallProgress = { extensionId: id, phase: 'done', percent: 100, message: 'Hoàn tất' };
        this.installProgress.set(done);
        progress$.next(done);
        progress$.complete();
        this.installing.delete(id);
      },
      error: err => {
        const error: InstallProgress = {
          extensionId: id,
          phase: 'error',
          percent: 0,
          error: err instanceof Error ? err.message : 'Cài đặt thất bại'
        };
        this.installProgress.set(error);
        progress$.next(error);
        progress$.error(error);
        this.installing.delete(id);
      }
    });

    return progress$.asObservable();
  }

  private applyExtension(id: string, languageId: string, snippets: IdeExtensionSnippet[]): void {
    if (!this.monaco) return;

    const key = `${id}:${languageId}`;
    if (this.disposables.has(key)) return;

    const monaco = this.monaco;
    const items: Monaco.IDisposable[] = [];

    if (snippets.length) {
      items.push(monaco.languages.registerCompletionItemProvider(languageId, {
        triggerCharacters: ['.', ':', '<', '#'],
        provideCompletionItems: (model, position) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
          };
          return {
            suggestions: snippets.map((s, i) => ({
              label: s.label,
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: s.insertText,
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              detail: s.detail,
              range,
              sortText: `0${i}`
            }))
          };
        }
      }));
    }

    this.disposables.set(key, items);
  }

  private cacheSnippets(id: string, snippets: IdeExtensionSnippet[], meta: Partial<IdeExtensionInfo>): void {
    this.snippetCache[id] = snippets;
    if (meta.version || meta.publisher || meta.iconUrl) {
      this.snippetCache[`${id}__meta`] = [{
        label: meta.version ?? '',
        insertText: JSON.stringify({
          version: meta.version,
          publisher: meta.publisher,
          iconUrl: meta.iconUrl
        }),
        detail: 'meta'
      }];
    }
    this.saveSnippetCache();
  }

  private getCachedMeta(id: string): { version?: string; publisher?: string; iconUrl?: string } | null {
    const metaSnippet = this.snippetCache[`${id}__meta`]?.[0];
    if (!metaSnippet) return null;
    try {
      return JSON.parse(metaSnippet.insertText);
    } catch {
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private loadInstalledIds(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch { /* ignore */ }
    return [...DEFAULT_INSTALLED];
  }

  private saveInstalledIds(ids: string[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  private loadExternalExtensions(): ExternalExtensionRecord[] {
    try {
      const raw = localStorage.getItem(EXTERNAL_KEY);
      if (raw) return JSON.parse(raw) as ExternalExtensionRecord[];
    } catch { /* ignore */ }
    return [];
  }

  private saveExternalExtensions(list: ExternalExtensionRecord[]): void {
    localStorage.setItem(EXTERNAL_KEY, JSON.stringify(list));
  }

  private loadSnippetCache(): Record<string, IdeExtensionSnippet[]> {
    try {
      const raw = localStorage.getItem(SNIPPET_CACHE_KEY);
      if (raw) return JSON.parse(raw) as Record<string, IdeExtensionSnippet[]>;
    } catch { /* ignore */ }
    return {};
  }

  private saveSnippetCache(): void {
    localStorage.setItem(SNIPPET_CACHE_KEY, JSON.stringify(this.snippetCache));
  }

  private loadDismissed(): Set<string> {
    try {
      const raw = localStorage.getItem(DISMISSED_KEY);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch { /* ignore */ }
    return new Set();
  }

  private isDismissed(id: string): boolean {
    return this.loadDismissed().has(id);
  }
}
