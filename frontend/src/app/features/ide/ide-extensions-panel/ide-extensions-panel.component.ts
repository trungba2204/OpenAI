import { Component, inject, signal, computed, output, OnDestroy, HostBinding } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IdeExtensionService } from '../../../core/services/ide-extension.service';
import { OpenVsxService } from '../../../core/services/open-vsx.service';
import { IdeExtensionInfo, OpenVsxSearchItem } from '../../../core/models/ide-extension';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

type PanelTab = 'recommended' | 'marketplace';

@Component({
  selector: 'app-ide-extensions-panel',
  imports: [FormsModule, DecimalPipe],
  host: { class: 'ide-extensions-host' },
  template: `
    <div class="ide-extensions">
      <div class="ide-extensions__header">
        <h2>Extensions</h2>
        <div class="ide-extensions__tabs">
          <button type="button" [class.active]="tab() === 'recommended'" (click)="setTab('recommended')">Đề xuất</button>
          <button type="button" [class.active]="tab() === 'marketplace'" (click)="setTab('marketplace')">Open VSX</button>
        </div>
        <input
          type="search"
          class="ide-extensions__search"
          [(ngModel)]="searchQueryValue"
          (ngModelChange)="onSearchChange($event)"
          placeholder="Tìm extension (python, java, rust...)" />
      </div>

      <div class="ide-extensions__body">
        @if (installedItems().length) {
          <section class="ide-extensions__section">
            <h3>Đã cài đặt — {{ installedItems().length }}</h3>
            @for (item of installedItems(); track item.id) {
              <div class="ide-extension-card ide-extension-card--installed">
                @if (item.iconUrl) {
                  <img class="ide-extension-card__img" [src]="item.iconUrl" [alt]="item.name" />
                } @else {
                  <div class="ide-extension-card__icon">{{ item.icon }}</div>
                }
                <div class="ide-extension-card__body">
                  <div class="ide-extension-card__title">
                    <strong>{{ item.name }}</strong>
                    <span class="ide-extension-card__publisher">{{ item.publisher }}</span>
                    @if (item.version) {
                      <span class="ide-extension-card__version">v{{ item.version }}</span>
                    }
                  </div>
                  <p class="ide-extension-card__desc">{{ item.description }}</p>
                </div>
                <div class="ide-extension-card__actions">
                  @if (canUninstall(item.id)) {
                    <button type="button" class="ide-extension-card__btn ide-extension-card__btn--ghost" (click)="uninstall(item.id)">Gỡ</button>
                  } @else {
                    <span class="ide-extension-card__badge">Mặc định</span>
                  }
                </div>
              </div>
            }
          </section>
        }

        @if (tab() === 'recommended') {
          <section class="ide-extensions__section">
            <h3>Đề xuất — {{ availableExtensions().length }}</h3>
            @if (!availableExtensions().length && !searchQuery().trim()) {
              <p class="ide-extensions__empty">Đã cài hết extension đề xuất.</p>
            } @else if (!availableExtensions().length) {
              <p class="ide-extensions__empty">Không khớp trong danh sách đề xuất. Xem Open VSX bên dưới.</p>
            }
            @for (ext of availableExtensions(); track ext.id) {
              <div class="ide-extension-card">
                @if (ext.iconUrl) {
                  <img class="ide-extension-card__img" [src]="ext.iconUrl" [alt]="ext.name" />
                } @else {
                  <div class="ide-extension-card__icon">{{ ext.icon }}</div>
                }
                <div class="ide-extension-card__body">
                  <div class="ide-extension-card__title">
                    <strong>{{ ext.name }}</strong>
                    <span class="ide-extension-card__publisher">{{ ext.publisher }}</span>
                    @if (ext.openVsx) {
                      <span class="ide-extension-card__tag">Open VSX</span>
                    }
                  </div>
                  <p class="ide-extension-card__desc">{{ ext.description }}</p>
                  <div class="ide-extension-card__meta">
                    <span>{{ extensionService.formatSize(ext.downloadSizeKb) }}</span>
                    <span>·</span>
                    <span>.{{ ext.fileExtensions.join(', .') }}</span>
                  </div>
                  @if (installingId() === ext.id) {
                    <div class="ide-extension-card__progress">
                      <div class="ide-extension-card__progress-bar" [style.width.%]="installPercent()"></div>
                    </div>
                    <span class="ide-extension-card__progress-label">{{ installMessage() }}</span>
                  }
                </div>
                <div class="ide-extension-card__actions">
                  <button
                    type="button"
                    class="ide-extension-card__btn ide-extension-card__btn--primary"
                    [disabled]="installingId() === ext.id"
                    (click)="install(ext)">
                    {{ installingId() === ext.id ? 'Đang tải...' : 'Cài đặt' }}
                  </button>
                </div>
              </div>
            }
          </section>
        }

        @if (tab() === 'marketplace' || showMarketplaceResults()) {
          <section class="ide-extensions__section">
            <h3>{{ tab() === 'marketplace' ? 'Marketplace Open VSX' : 'Kết quả Open VSX' }}</h3>
            @if (marketplaceLoading()) {
              <p class="ide-extensions__empty">Đang tìm trên open-vsx.org...</p>
            } @else if (marketplaceError()) {
              <p class="ide-extensions__empty ide-extensions__error">{{ marketplaceError() }}</p>
            } @else if (!marketplaceResults().length) {
              <p class="ide-extensions__empty">
                @if (searchQuery().trim()) {
                  Không tìm thấy trên Open VSX. Thử từ khóa khác (vd: python, java).
                } @else {
                  Nhập từ khóa hoặc chọn tab Open VSX để xem extension phổ biến.
                }
              </p>
            }
            @for (item of marketplaceResults(); track item.id) {
              <div class="ide-extension-card">
                @if (item.iconUrl) {
                  <img class="ide-extension-card__img" [src]="item.iconUrl" [alt]="item.displayName" />
                } @else {
                  <div class="ide-extension-card__icon">🧩</div>
                }
                <div class="ide-extension-card__body">
                  <div class="ide-extension-card__title">
                    <strong>{{ item.displayName }}</strong>
                    <span class="ide-extension-card__publisher">{{ item.publisher }}</span>
                    @if (item.verified) {
                      <span class="ide-extension-card__tag ide-extension-card__tag--verified">✓ Verified</span>
                    }
                  </div>
                  <p class="ide-extension-card__desc">{{ item.description }}</p>
                  <div class="ide-extension-card__meta">
                    <span>v{{ item.version }}</span>
                    <span>·</span>
                    <span>{{ item.downloadCount | number }} lượt tải</span>
                  </div>
                  @if (installingId() === item.id) {
                    <div class="ide-extension-card__progress">
                      <div class="ide-extension-card__progress-bar" [style.width.%]="installPercent()"></div>
                    </div>
                    <span class="ide-extension-card__progress-label">{{ installMessage() }}</span>
                  }
                </div>
                <div class="ide-extension-card__actions">
                  @if (extensionService.isInstalled(item.id)) {
                    <span class="ide-extension-card__badge">Đã cài</span>
                  } @else {
                    <button
                      type="button"
                      class="ide-extension-card__btn ide-extension-card__btn--primary"
                      [disabled]="installingId() === item.id"
                      (click)="installMarketplace(item)">
                      {{ installingId() === item.id ? 'Đang tải...' : 'Cài đặt' }}
                    </button>
                  }
                </div>
              </div>
            }
          </section>
        }
      </div>
    </div>
  `
})
export class IdeExtensionsPanelComponent implements OnDestroy {
  @HostBinding('class') hostClass = 'ide-extensions-host';

  extensionService = inject(IdeExtensionService);
  private openVsx = inject(OpenVsxService);
  extensionInstalled = output<string>();

  tab = signal<PanelTab>('recommended');
  searchQuery = signal('');
  searchQueryValue = '';
  installingId = signal<string | null>(null);
  installPercent = signal(0);
  installMessage = signal('Đang tải...');
  marketplaceLoading = signal(false);
  marketplaceError = signal('');
  marketplaceResults = signal<OpenVsxSearchItem[]>([]);

  showMarketplaceResults = computed(() => {
    const q = this.searchQuery().trim();
    return q.length >= 2 && this.tab() === 'recommended';
  });

  private search$ = new Subject<string>();
  private searchSub = this.search$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => {
      const query = q.trim();
      if (!query) {
        this.marketplaceLoading.set(false);
        this.marketplaceError.set('');
        if (this.tab() === 'marketplace') {
          return this.openVsx.search('language', 24).pipe(
            catchError(err => {
              this.marketplaceError.set(this.errorMessage(err));
              return of([]);
            })
          );
        }
        return of([]);
      }

      this.marketplaceLoading.set(true);
      this.marketplaceError.set('');
      return this.openVsx.search(query, 24).pipe(
        catchError(err => {
          this.marketplaceError.set(this.errorMessage(err));
          return of([]);
        })
      );
    })
  ).subscribe({
    next: items => {
      this.marketplaceResults.set(items);
      this.marketplaceLoading.set(false);
    },
    error: err => {
      this.marketplaceError.set(this.errorMessage(err));
      this.marketplaceLoading.set(false);
      this.marketplaceResults.set([]);
    }
  });

  installedItems = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const catalog = this.extensionService.getCatalog()
      .filter(ext => this.extensionService.isInstalled(ext.id))
      .map(ext => ({
        id: ext.id,
        name: ext.name,
        publisher: ext.publisher,
        description: ext.description,
        icon: ext.icon,
        iconUrl: ext.iconUrl,
        version: ext.version,
        source: ext.source,
        fileExtensions: ext.fileExtensions
      }));

    const external = this.extensionService.getExternalExtensions()
      .map(ext => ({
        id: ext.id,
        name: ext.displayName,
        publisher: ext.publisher,
        description: ext.description,
        icon: '🧩',
        iconUrl: ext.iconUrl,
        version: ext.version,
        source: 'openvsx' as const,
        fileExtensions: [] as string[]
      }));

    return [...catalog, ...external].filter(item =>
      !q || this.matchesText([item.name, item.publisher, item.description], q)
    );
  });

  availableExtensions = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    return this.extensionService.getCatalog()
      .filter(ext => !this.extensionService.isInstalled(ext.id))
      .filter(ext => !q || this.matchesCatalog(ext, q));
  });

  ngOnDestroy(): void {
    this.searchSub.unsubscribe();
  }

  setTab(value: PanelTab): void {
    this.tab.set(value);
    if (value === 'marketplace') {
      this.triggerMarketplaceSearch(this.searchQuery().trim() || 'language');
    }
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    const q = value.trim();
    if (q.length >= 2 || this.tab() === 'marketplace') {
      this.search$.next(q || 'language');
    } else {
      this.marketplaceResults.set([]);
      this.marketplaceError.set('');
      this.marketplaceLoading.set(false);
    }
  }

  canUninstall(id: string): boolean {
    return !['typescript', 'javascript', 'html', 'css', 'json', 'markdown'].includes(id);
  }

  install(ext: IdeExtensionInfo): void {
    this.startInstall(ext.id, this.extensionService.install(ext.id), ext.id);
  }

  installMarketplace(item: OpenVsxSearchItem): void {
    this.startInstall(item.id, this.extensionService.installMarketplace(item), item.id);
  }

  uninstall(id: string): void {
    this.extensionService.uninstall(id);
  }

  private triggerMarketplaceSearch(query: string): void {
    this.search$.next(query);
  }

  private startInstall(trackId: string, stream: ReturnType<IdeExtensionService['install']>, emitId: string): void {
    this.installingId.set(trackId);
    this.installPercent.set(0);
    stream.subscribe({
      next: progress => {
        this.installPercent.set(progress.percent);
        this.installMessage.set(progress.message ?? this.phaseLabel(progress.phase));
        if (progress.phase === 'done') {
          this.installingId.set(null);
          this.extensionInstalled.emit(emitId);
        }
        if (progress.phase === 'error') {
          this.installingId.set(null);
          this.installMessage.set(progress.error ?? 'Cài đặt thất bại');
        }
      },
      error: err => {
        this.installingId.set(null);
        this.installMessage.set(this.errorMessage(err));
      }
    });
  }

  private phaseLabel(phase: string): string {
    if (phase === 'downloading') return 'Đang tải từ Open VSX...';
    if (phase === 'installing') return 'Đang cài...';
    return 'Hoàn tất';
  }

  private matchesCatalog(ext: IdeExtensionInfo, q: string): boolean {
    const terms = q.split(/\s+/).filter(Boolean);
    const haystack = [ext.name, ext.publisher, ext.description, ext.languageId, ext.id, ...ext.tags, ...ext.fileExtensions]
      .join(' ')
      .toLowerCase();
    return terms.every(term => haystack.includes(term));
  }

  private matchesText(parts: string[], q: string): boolean {
    const terms = q.split(/\s+/).filter(Boolean);
    const haystack = parts.join(' ').toLowerCase();
    return terms.every(term => haystack.includes(term));
  }

  private errorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err && 'message' in err) return String((err as { message: string }).message);
    return 'Không thể kết nối Open VSX. Kiểm tra mạng và thử lại.';
  }
}
