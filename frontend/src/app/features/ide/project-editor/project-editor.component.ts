import {
  Component, inject, OnInit, OnDestroy, signal, computed, ElementRef, viewChild, AfterViewInit,
  HostListener, effect
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import loader from '@monaco-editor/loader';
import type * as Monaco from 'monaco-editor';
import { ProjectService } from '../../../core/services/project.service';
import { IdeAiService } from '../../../core/services/ide-ai.service';
import { GitService } from '../../../core/services/git.service';
import { TerminalService } from '../../../core/services/terminal.service';
import { ChatService } from '../../../core/services/chat.service';
import { AiModel, AiModelInfo } from '../../../core/models';
import {
  ContextScope, FileTreeNode, GitConnection, GitRepoSuggest, GitStatus, IdeAgentResponse,
  IdeChatMessage, IdeFileEdit, IdeSearchResult, IdeSelectionContext, InlineAction, Project,
  TerminalLine
} from '../../../core/models/ide';
import { forkJoin, finalize, map, Observable, of } from 'rxjs';
import { stripMarkdown } from '../../../core/utils/plain-text';
import {
  getChangedLineNumbers,
  applyScopedEdit,
  extractCodeFromAi,
  pathsMatch,
  resolveSelectionEndLine
} from '../../../core/utils/diff-lines';
import { IdeExtensionService } from '../../../core/services/ide-extension.service';
import { IdeExtensionsPanelComponent } from '../ide-extensions-panel/ide-extensions-panel.component';
import { IdeExtensionInfo } from '../../../core/models/ide-extension';
import { IdeCompletionService } from '../../../core/services/ide-completion.service';
import { getEditorSuggestOptions } from '../../../core/utils/ide-completion';
import { ThemeService } from '../../../core/services/theme.service';

interface OpenTab {
  fileId: number;
  name: string;
  path: string;
  content: string;
  dirty: boolean;
}

type PromptAction = 'generate' | 'refactor' | 'multiedit' | 'agent' | 'review';
type RightPanel = 'chat' | 'git' | 'search';
type LeftPanel = 'explorer' | 'extensions';

interface StagedEdit {
  path: string;
  fileId: number | null;
  originalContent: string;
  newContent: string;
  create: boolean;
  changedLines: number[];
}

interface ChatCodeAttachment {
  id: string;
  kind: 'snippet' | 'file';
  filePath: string;
  fileId: number | null;
  startLine: number;
  endLine: number;
  code: string;
}

interface VisibleTreeNode extends FileTreeNode {
  depth: number;
  expanded: boolean;
  hasChildren: boolean;
}

@Component({
  selector: 'app-project-editor',
  imports: [FormsModule, RouterLink, IdeExtensionsPanelComponent],
  template: `
    <div class="ide-layout">
      <nav class="ide-activity-bar" aria-label="IDE panels">
        <button
          type="button"
          class="ide-activity-bar__btn"
          [class.active]="leftPanel() === 'explorer'"
          (click)="setLeftPanel('explorer')"
          title="Explorer">
          📁
        </button>
        <button
          type="button"
          class="ide-activity-bar__btn"
          [class.active]="leftPanel() === 'extensions'"
          (click)="setLeftPanel('extensions')"
          title="Extensions">
          🧩
          @if (extensionBadgeCount() > 0) {
            <span class="ide-activity-bar__badge">{{ extensionBadgeCount() }}</span>
          }
        </button>
      </nav>

      <aside class="ide-explorer">
        @if (leftPanel() === 'explorer') {
          <div class="ide-explorer__header">
            <a [routerLink]="['/workspaces', project()?.workspaceId]" class="admin-link">← {{ project()?.name }}</a>
            <div class="ide-explorer__toolbar">
              <button type="button" (click)="collapseAllFolders()" title="Thu gọn tất cả thư mục">Thu gọn</button>
              <button type="button" (click)="expandAllFolders()" title="Mở rộng tất cả thư mục">Mở rộng</button>
            </div>
          </div>
          <div class="ide-explorer__tree">
            @for (node of visibleTree(); track node.id) {
              <div
                class="ide-tree-item"
                [class.active]="activeFileId() === node.id"
                [class.ide-tree-item--dir]="node.directory"
                [style.padding-left.rem]="0.5 + node.depth * 0.75">
                @if (node.hasChildren) {
                  <button
                    type="button"
                    class="ide-tree-item__chevron"
                    (click)="toggleFolder(node.path, $event)"
                    [attr.aria-label]="node.expanded ? 'Thu gọn' : 'Mở rộng'">
                    {{ node.expanded ? '▼' : '▶' }}
                  </button>
                } @else {
                  <span class="ide-tree-item__chevron ide-tree-item__chevron--placeholder"></span>
                }
                <button
                  type="button"
                  class="ide-tree-item__label"
                  [draggable]="!node.directory"
                  (click)="onNodeClick(node)"
                  (dragstart)="onTreeDragStart($event, node)"
                  (dragend)="onTreeDragEnd()">
                  <span>{{ node.directory ? '📁' : '📄' }}</span>
                  <span>{{ node.name || project()?.name }}</span>
                </button>
              </div>
            }
          </div>
        } @else {
          <app-ide-extensions-panel (extensionInstalled)="onExtensionInstalled($event)" />
        }
      </aside>

      <div class="ide-main" [class.ide-main--terminal-open]="terminalOpen()">
        <div class="ide-toolbar">
          <button type="button" class="feature-btn feature-btn--sm" (click)="openPrompt('generate')" title="Generate code">✨ Generate</button>
          <button type="button" class="feature-btn feature-btn--sm" (click)="openPrompt('refactor')">🔧 Refactor</button>
          <button type="button" class="feature-btn feature-btn--sm" (click)="openPrompt('multiedit')">📂 Multi-edit</button>
          <button type="button" class="feature-btn feature-btn--sm" (click)="openPrompt('review')">🔍 Review</button>
          <button type="button" class="feature-btn feature-btn--sm" (click)="runArchitecture()" [disabled]="aiLoading()">🏗️ Arch</button>
          <button type="button" class="feature-btn feature-btn--sm" (click)="openPrompt('agent')">🤖 Agent</button>
          <button
            type="button"
            class="feature-btn feature-btn--sm"
            [class.feature-btn--primary]="autoFixMode()"
            (click)="runAutoFix()"
            [disabled]="aiLoading()"
            title="AI tự phát hiện và sửa lỗi">
            🩹 Tự sửa
          </button>
          <span class="ide-toolbar__sep"></span>
          <button type="button" class="feature-btn feature-btn--sm" (click)="reindexProject()" [disabled]="indexing()">
            {{ indexing() ? 'Đang index...' : '📇 Index' }}
          </button>
          <button type="button" class="feature-btn feature-btn--sm" (click)="toggleTerminal()" [class.feature-btn--primary]="terminalOpen()">
            ⌨️ Terminal
          </button>
          <button type="button" class="feature-btn feature-btn--sm" (click)="setRightPanel('git')">Git</button>
          <button
            type="button"
            class="feature-btn feature-btn--sm feature-btn--primary"
            (click)="commitAndPushGit()"
            [disabled]="gitLoading()"
            title="Tự tạo repo GitHub (nếu cần), commit và push">
            ⬆ GitHub
          </button>
          <button type="button" class="feature-btn feature-btn--sm" (click)="setRightPanel('search')">Search</button>
          <button type="button" class="feature-btn feature-btn--sm" (click)="setRightPanel('chat')">Chat</button>
          <button type="button" class="feature-btn feature-btn--sm" (click)="setLeftPanel('extensions')" title="Extensions ngôn ngữ">🧩</button>
          <span class="ide-toolbar__sep"></span>
          <button
            type="button"
            class="feature-btn feature-btn--sm ide-toolbar__theme"
            (click)="theme.toggle()"
            [title]="theme.isDark() ? 'Chuyển nền sáng' : 'Chuyển nền tối'">
            {{ theme.isDark() ? '☀️' : '🌙' }}
          </button>
        </div>

        @if (suggestedExtension()) {
          <div class="ide-extension-prompt">
            <span>
              File <strong>{{ activeTab()?.name }}</strong> cần extension
              <strong>{{ suggestedExtension()!.icon }} {{ suggestedExtension()!.name }}</strong>
              để highlight và snippets đầy đủ.
            </span>
            <div class="ide-extension-prompt__actions">
              <button type="button" class="feature-btn feature-btn--sm feature-btn--primary" (click)="installSuggestedExtension()" [disabled]="installingExtension()">
                {{ installingExtension() ? 'Đang cài...' : 'Cài đặt' }}
              </button>
              <button type="button" class="feature-btn feature-btn--sm" (click)="dismissExtensionPrompt()">Bỏ qua</button>
              <button type="button" class="feature-btn feature-btn--sm" (click)="setLeftPanel('extensions')">Xem Extensions</button>
            </div>
          </div>
        }

        @if (stagedEdits().length) {
          <div class="ide-review-bar">
            <span class="ide-review-bar__info">
              <strong>{{ stagedEdits().length }}</strong> file đã sửa
              <span class="ide-review-bar__hint">— dòng vàng = thay đổi của AI</span>
            </span>
            <div class="ide-review-bar__actions">
              <button type="button" class="feature-btn feature-btn--sm feature-btn--primary" (click)="keepAllEdits()" [disabled]="applyingEdits()">
                ✓ Keep
              </button>
              <button type="button" class="feature-btn feature-btn--sm ide-review-bar__undo" (click)="undoAllEdits()" [disabled]="applyingEdits()">
                ↩ Undo all
              </button>
            </div>
          </div>
        }

        @if (tabs().length) {
          <div class="ide-tabs">
            @for (tab of tabs(); track tab.fileId) {
              <button
                type="button"
                class="ide-tab"
                [class.active]="activeFileId() === tab.fileId"
                (click)="selectTab(tab.fileId)">
                {{ tab.name }}{{ tab.dirty ? ' •' : '' }}
              </button>
            }
          </div>
        }

        <div class="ide-editor-wrap" #editorWrap>
          @if (activeTab()) {
            <div #editorHost class="ide-editor"></div>
            @if (selectionWidgetVisible()) {
              <div
                class="ide-selection-widget"
                [style.top.px]="selectionWidgetPos().top"
                [style.left.px]="selectionWidgetPos().left"
                (mousedown)="$event.preventDefault()">
                <button type="button" class="ide-selection-widget__primary" (click)="addSelectionToChat()">
                  Add to Chat
                </button>
                <span class="ide-selection-widget__sep"></span>
                <button type="button" (click)="runInline('EXPLAIN')" [disabled]="aiLoading()">Explain</button>
                <button type="button" (click)="runInline('REFACTOR')" [disabled]="aiLoading()">Refactor</button>
                <button type="button" (click)="runInline('OPTIMIZE')" [disabled]="aiLoading()">Optimize</button>
                <button type="button" (click)="runInline('TEST')" [disabled]="aiLoading()">Test</button>
              </div>
            }
          } @else {
            <div class="ide-empty-editor">Chọn file từ cây thư mục bên trái</div>
          }
        </div>

        @if (terminalOpen()) {
          <div class="ide-terminal" (mousedown)="onTerminalMouseDown($event)">
            <div class="ide-terminal__header">
              <span class="ide-terminal__title">
                {{ terminalShell === 'powershell' ? 'PowerShell' : 'Bash' }}
                <small>{{ terminalCwd() }}</small>
              </span>
              <div class="ide-terminal__actions">
                <select class="ide-terminal__shell" [(ngModel)]="terminalShell" (change)="onTerminalShellChange()">
                  @for (s of terminalShells(); track s) {
                    <option [value]="s">{{ s === 'powershell' ? 'PowerShell' : 'Bash' }}</option>
                  }
                </select>
                <button type="button" class="feature-btn feature-btn--sm" (click)="refreshTerminalListing()">📂 Files</button>
                <button type="button" class="feature-btn feature-btn--sm" (click)="runTerminalQuick('git status')">git status</button>
                <button type="button" class="feature-btn feature-btn--sm" (click)="clearTerminal()">Clear</button>
                <button type="button" class="feature-btn feature-btn--sm" (click)="toggleTerminal()">✕</button>
              </div>
            </div>
            <div class="ide-terminal__body" #terminalOutput>
              @for (line of terminalLines(); track $index) {
                <div class="ide-terminal__line" [class.ide-terminal__line--prompt]="line.kind === 'prompt'"
                  [class.ide-terminal__line--error]="line.kind === 'error'"
                  [class.ide-terminal__line--meta]="line.kind === 'meta'">{{ line.text }}</div>
              }
              @if (terminalRunning()) {
                <div class="ide-terminal__line ide-terminal__line--meta">Đang chạy...</div>
              }
            </div>
            <form class="ide-terminal__input-row" (submit)="runTerminalCommand($event)">
              <span class="ide-terminal__prompt">{{ terminalPrompt() }}</span>
              <input
                #terminalInputRef
                type="text"
                class="ide-terminal__input"
                [(ngModel)]="terminalInput"
                name="terminalInputField"
                [disabled]="terminalRunning()"
                placeholder="git status, git add ., ls, dir..."
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false" />
            </form>
          </div>
        }
      </div>

      <aside class="ide-chat-panel">
        <div class="ide-panel-tabs">
          <button type="button" [class.active]="rightPanel() === 'chat'" (click)="setRightPanel('chat')">💬 Chat</button>
          <button type="button" [class.active]="rightPanel() === 'git'" (click)="setRightPanel('git')">Git</button>
          <button type="button" [class.active]="rightPanel() === 'search'" (click)="setRightPanel('search')">Search</button>
        </div>

        @if (rightPanel() === 'chat') {
          <div class="ide-chat-view">
            <div class="ide-chat-messages" #chatMessagesHost>
              @for (msg of chatMessages(); track $index) {
                <div class="ide-chat-msg" [class.ide-chat-msg--user]="msg.role === 'user'" [class.ide-chat-msg--assistant]="msg.role === 'assistant'">
                  {{ displayMessage(msg) }}@if (msg.animating) {<span class="ide-chat-cursor" aria-hidden="true"></span>}
                </div>
              }
              @if (aiLoading()) {
                <div class="ide-chat-msg ide-chat-msg--assistant ide-chat-msg--loading">
                  <span class="ide-typing-dots" aria-hidden="true"><span></span><span></span><span></span></span>
                  Đang suy nghĩ...
                </div>
              }
            </div>
            <div class="ide-chat-input">
              <div
                class="chat-input-card"
                [class.chat-input-card--dragover]="chatDragOver()"
                (dragover)="onChatDragOver($event)"
                (dragleave)="onChatDragLeave($event)"
                (drop)="onChatDrop($event)">
                @if (chatAttachments().length) {
                  <div class="ide-chat-attachments">
                    @for (a of chatAttachments(); track a.id) {
                      <div class="ide-chat-attachment">
                        <span class="ide-chat-attachment__icon">{{ a.kind === 'file' ? '📄' : '📎' }}</span>
                        <div class="ide-chat-attachment__meta">
                          <span class="ide-chat-attachment__name">{{ a.filePath }}</span>
                          <span class="ide-chat-attachment__range">
                            @if (a.kind === 'file') {
                              toàn file · {{ a.code.length }} ký tự
                            } @else {
                              dòng {{ a.startLine }}–{{ a.endLine }} · {{ a.code.length }} ký tự
                            }
                          </span>
                        </div>
                        <button type="button" class="ide-chat-attachment__remove" (click)="removeChatAttachment(a.id)" [disabled]="aiLoading()" title="Gỡ">✕</button>
                      </div>
                    }
                  </div>
                }
                <textarea
                  [(ngModel)]="chatInput"
                  [placeholder]="chatInputPlaceholder()"
                  (keydown.enter)="onChatEnter($event)"
                  [disabled]="aiLoading()"
                  rows="3"></textarea>
                <div class="chat-input-toolbar">
                  <select class="chat-model-select" [(ngModel)]="selectedModel" [disabled]="aiLoading()" title="Chọn model">
                    @for (m of models(); track m.id) {
                      <option [value]="m.id">{{ m.displayName }}</option>
                    }
                  </select>
                  <button
                    type="button"
                    class="ide-autofix-toggle"
                    [class.ide-autofix-toggle--on]="autoFixMode()"
                    (click)="toggleAutoFix()"
                    [disabled]="aiLoading()"
                    title="Bật: AI tự áp dụng sửa code">
                    🩹
                  </button>
                  <div class="chat-input-toolbar__spacer"></div>
                  <button
                    type="button"
                    class="chat-input__send"
                    (click)="sendChat()"
                    [disabled]="aiLoading() || (!autoFixMode() && !chatInput.trim() && !chatAttachments().length)"
                    title="Gửi">
                    ➤
                  </button>
                </div>
              </div>
              <p class="ide-chat-input__hint">Kéo thả file từ cây thư mục · Add to chat khi bôi đen code · Enter gửi</p>
            </div>
          </div>
        }

        @if (rightPanel() === 'git') {
          <div class="ide-git-panel">
            @if (gitConnection()?.connected) {
              <div class="ide-git-summary">
                <p class="ide-git-status ide-git-status--ok">✓ Đã kết nối GitHub</p>
                <p class="ide-git-meta">{{ gitConnection()?.remoteUrl }}</p>
                <p class="ide-git-meta">Branch: <strong>{{ gitStatus()?.branch || gitConnection()?.branch }}</strong></p>
                @if (gitConnection()?.lastSyncAt) {
                  <p class="ide-git-meta">Lần sync: {{ gitConnection()?.lastSyncAt }}</p>
                }
              </div>

              @if (gitStatus(); as status) {
                @if (status.changedFiles.length || status.untrackedFiles.length) {
                  <div class="ide-git-changes">
                    <p class="ide-git-changes__title">Thay đổi chưa commit ({{ status.changedFiles.length + status.untrackedFiles.length }})</p>
                    <ul class="ide-git-changes__list">
                      @for (f of status.changedFiles; track f) {
                        <li class="ide-git-changes__item ide-git-changes__item--modified">M {{ f }}</li>
                      }
                      @for (f of status.untrackedFiles; track f) {
                        <li class="ide-git-changes__item ide-git-changes__item--new">+ {{ f }}</li>
                      }
                    </ul>
                  </div>
                } @else {
                  <p class="ide-git-meta">Không có thay đổi local — sẵn sàng push nếu có commit chưa đẩy.</p>
                }
              }

              <label>Commit message</label>
              <textarea
                class="ide-git-commit-input"
                [(ngModel)]="gitCommitMessage"
                rows="2"
                placeholder="feat: mô tả thay đổi..."></textarea>
              <button
                type="button"
                class="feature-btn feature-btn--sm"
                (click)="suggestGitCommitMessage()"
                [disabled]="gitLoading() || aiLoading()">
                ✨ AI gợi ý
              </button>

              <div class="ide-git-actions">
                <button type="button" class="feature-btn feature-btn--sm" (click)="refreshGitStatus()" [disabled]="gitLoading()">↻ Làm mới</button>
                <button type="button" class="feature-btn feature-btn--sm" (click)="pullGit()" [disabled]="gitLoading()">↓ Pull</button>
                <button
                  type="button"
                  class="feature-btn feature-btn--sm feature-btn--primary"
                  (click)="commitAndPushGit()"
                  [disabled]="gitLoading()">
                  ↑ Commit &amp; Push
                </button>
              </div>
            } @else {
              <p class="ide-git-status">IDE tự tạo repo GitHub theo tên project</p>
              @if (gitRepoSuggest(); as suggest) {
                <p class="ide-git-meta">Project: <strong>{{ suggest.projectName }}</strong></p>
                <label>Tên repo (tự đặt)</label>
                <input type="text" [(ngModel)]="gitRepoName" [placeholder]="suggest.repoName" />
                <p class="ide-git-hint">Sẽ tạo: <code>github.com/&lt;user&gt;/{{ gitRepoName || suggest.repoName }}</code></p>
              }
              <label>Branch</label>
              <input type="text" [(ngModel)]="gitBranch" placeholder="main" />
              <label class="ide-git-checkbox">
                <input type="checkbox" [(ngModel)]="gitPrivateRepo" />
                Repo private
              </label>
              <label>Personal Access Token</label>
              <input type="password" [(ngModel)]="gitToken" placeholder="ghp_xxxxxxxx" />
              <p class="ide-git-hint">Token cần quyền <code>repo</code>. GitHub → Settings → Developer settings → Personal access tokens.</p>
              <div class="ide-git-actions">
                <button type="button" class="feature-btn feature-btn--sm feature-btn--primary" (click)="connectGit()" [disabled]="gitLoading()">
                  {{ gitLoading() ? 'Đang tạo repo...' : 'Tạo repo & Kết nối' }}
                </button>
                <button type="button" class="feature-btn feature-btn--sm feature-btn--primary" (click)="commitAndPushGit()" [disabled]="gitLoading()">
                  Tạo repo & Push luôn
                </button>
              </div>
            }

            @if (gitConnection()?.connected) {
              <details class="ide-git-settings">
                <summary>Cài đặt nâng cao (URL thủ công)</summary>
                <label>Remote URL (để trống = tự tạo repo)</label>
                <input type="text" [(ngModel)]="gitRemoteUrl" placeholder="https://github.com/ten-ban/ten-repo" />
                <label>Tên repo tùy chỉnh</label>
                <input type="text" [(ngModel)]="gitRepoName" placeholder="my-project-1" />
                <label>Branch</label>
                <input type="text" [(ngModel)]="gitBranch" placeholder="main" />
                <label>GitHub Username (tùy chọn)</label>
                <input type="text" [(ngModel)]="gitUsername" />
                <label>Access Token</label>
                <input type="password" [(ngModel)]="gitToken" placeholder="ghp_..." />
                <label class="ide-git-checkbox">
                  <input type="checkbox" [(ngModel)]="gitPrivateRepo" />
                  Repo private
                </label>
                <button type="button" class="feature-btn feature-btn--sm" (click)="connectGit()" [disabled]="gitLoading()">Cập nhật kết nối</button>
              </details>
            }

            @if (gitMessage()) {
              <p class="ide-git-message" [class.ide-git-message--ok]="gitMessageOk()">{{ gitMessage() }}</p>
            }
          </div>
        }

        @if (rightPanel() === 'search') {
          <div class="ide-search-panel">
            <div class="ide-search-input">
              <input type="text" [(ngModel)]="searchQuery" placeholder="Tìm symbol, logic..." (keydown.enter)="runSearch()" />
              <button type="button" class="feature-btn feature-btn--sm feature-btn--primary" (click)="runSearch()" [disabled]="aiLoading()">Tìm</button>
            </div>
            @if (searchSummary()) {
              <div class="ide-search-summary">{{ searchSummary() }}</div>
            }
            <div class="ide-search-results">
              @for (r of searchResults(); track r.filePath + r.lineNumber) {
                <button type="button" class="ide-search-item" (click)="openFileByPath(r.filePath)">
                  <strong>{{ r.symbolName || r.filePath }}</strong>
                  <span>{{ r.filePath }}:{{ r.lineNumber }}</span>
                  <small>{{ r.snippet }}</small>
                </button>
              }
            </div>
          </div>
        }

        @if (pendingEdits().length) {
          <div class="ide-edits-panel">
            <div class="ide-edits-panel__header">
              <span>{{ pendingEdits().length }} thay đổi đề xuất</span>
              <button type="button" class="feature-btn feature-btn--sm feature-btn--primary" (click)="stagePendingEdits()" [disabled]="applyingEdits()">
                Xem &amp; sửa
              </button>
            </div>
            <ul>
              @for (e of pendingEdits(); track e.path) {
                <li>{{ e.create ? '+' : '~' }} {{ e.path }}</li>
              }
            </ul>
          </div>
        }

        @if (stagedEdits().length) {
          <div class="ide-edits-panel ide-edits-panel--review">
            <div class="ide-edits-panel__header">
              <span>Đang xem xét</span>
              <div class="ide-edits-panel__actions">
                <button type="button" class="feature-btn feature-btn--sm feature-btn--primary" (click)="keepAllEdits()" [disabled]="applyingEdits()">Keep</button>
                <button type="button" class="feature-btn feature-btn--sm" (click)="undoAllEdits()" [disabled]="applyingEdits()">Undo all</button>
              </div>
            </div>
            <ul>
              @for (e of stagedEdits(); track e.path) {
                <li>
                  <button type="button" class="ide-edits-item" [class.active]="activeTab()?.path === e.path" (click)="openStagedFile(e)">
                    <span>{{ e.create ? '+' : '~' }} {{ e.path }}</span>
                    <span class="ide-edit-lines">{{ e.changedLines.length }} dòng</span>
                  </button>
                </li>
              }
            </ul>
          </div>
        }
      </aside>
    </div>

    @if (promptAction()) {
      <div class="ide-modal-backdrop" (click)="closePrompt()">
        <div class="ide-modal" (click)="$event.stopPropagation()">
          <h3>{{ promptTitle() }}</h3>
          <textarea [(ngModel)]="promptInput" rows="5" [placeholder]="promptPlaceholder()"></textarea>
          <div class="ide-modal__actions">
            <button type="button" class="feature-btn feature-btn--sm" (click)="closePrompt()">Hủy</button>
            <button type="button" class="feature-btn feature-btn--sm feature-btn--primary" (click)="submitPrompt()" [disabled]="aiLoading() || !promptInput.trim()">
              Chạy
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ProjectEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);
  private ideAiService = inject(IdeAiService);
  private gitService = inject(GitService);
  private terminalService = inject(TerminalService);
  private chatService = inject(ChatService);
  private extensionService = inject(IdeExtensionService);
  private completionService = inject(IdeCompletionService);
  theme = inject(ThemeService);

  constructor() {
    effect(() => {
      const dark = this.theme.isDark();
      if (this.monaco && this.editor) {
        this.monaco.editor.setTheme(dark ? 'vs-dark' : 'vs');
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  onSaveShortcut(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (this.activeTab()) this.saveFile();
    }
  }

  private editorHost = viewChild<ElementRef<HTMLDivElement>>('editorHost');
  private editorWrap = viewChild<ElementRef<HTMLDivElement>>('editorWrap');
  private chatMessagesEl = viewChild<ElementRef<HTMLDivElement>>('chatMessagesHost');
  private terminalOutputEl = viewChild<ElementRef<HTMLDivElement>>('terminalOutput');
  private terminalInputRef = viewChild<ElementRef<HTMLInputElement>>('terminalInputRef');
  private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  private monaco: typeof Monaco | null = null;
  private contentChangeDisposable: Monaco.IDisposable | null = null;
  private selectionDisposable: Monaco.IDisposable | null = null;
  private scrollDisposable: Monaco.IDisposable | null = null;
  private layoutDisposable: Monaco.IDisposable | null = null;
  private typewriterTimer: ReturnType<typeof setInterval> | null = null;
  private editDecorationIds: string[] = [];

  project = signal<Project | null>(null);
  tree = signal<FileTreeNode[]>([]);
  flatTree = signal<Array<FileTreeNode & { depth: number }>>([]);
  collapsedDirs = signal<Set<string>>(new Set());
  visibleTree = computed(() => this.buildVisibleTree(this.tree(), this.collapsedDirs()));
  tabs = signal<OpenTab[]>([]);
  activeFileId = signal<number | null>(null);
  activeTab = signal<OpenTab | null>(null);
  chatMessages = signal<IdeChatMessage[]>([]);
  aiLoading = signal(false);
  indexing = signal(false);
  applyingEdits = signal(false);
  chatInput = '';
  models = signal<AiModelInfo[]>([]);
  selectedModel: AiModel = 'GROQ_LLAMA_70B';
  selectedCode = signal('');
  selectedRange = signal<{ startLine: number; endLine: number } | null>(null);
  selectionWidgetVisible = signal(false);
  selectionWidgetPos = signal({ top: 0, left: 0 });
  chatAttachments = signal<ChatCodeAttachment[]>([]);
  chatDragOver = signal(false);
  treeDragging = signal(false);
  rightPanel = signal<RightPanel>('chat');
  leftPanel = signal<LeftPanel>('explorer');
  suggestedExtension = signal<IdeExtensionInfo | null>(null);
  installingExtension = signal(false);
  extensionBadgeCount = this.extensionService.availableCount;
  promptAction = signal<PromptAction | null>(null);
  promptInput = '';
  pendingEdits = signal<IdeFileEdit[]>([]);
  stagedEdits = signal<StagedEdit[]>([]);
  autoFixMode = signal(false);
  /** Giữ vùng chọn tại thời điểm gọi AI — không phụ thuộc selection sau khi AI trả lời */
  pendingEditSelection = signal<IdeSelectionContext | null>(null);
  searchQuery = '';
  searchResults = signal<IdeSearchResult[]>([]);
  searchSummary = signal('');
  gitConnection = signal<GitConnection | null>(null);
  gitStatus = signal<GitStatus | null>(null);
  gitRepoSuggest = signal<GitRepoSuggest | null>(null);
  gitLoading = signal(false);
  gitMessage = signal('');
  gitMessageOk = signal(false);
  gitCommitMessage = '';
  gitRepoName = '';
  gitPrivateRepo = false;
  gitRemoteUrl = '';
  gitBranch = 'main';
  gitUsername = '';
  gitToken = '';
  terminalOpen = signal(false);
  terminalLines = signal<TerminalLine[]>([]);
  terminalShells = signal<string[]>(['powershell', 'bash']);
  terminalShell = 'powershell';
  terminalCwd = signal('');
  terminalRunning = signal(false);
  terminalInput = '';
  private terminalHistory: string[] = [];
  private terminalHistoryIndex = -1;
  projectId = 0;

  ngOnInit(): void {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.projectService.get(this.projectId).subscribe(p => this.project.set(p));
    this.loadTree();
    this.loadGitConnection();
    this.loadGitRepoSuggest();
    this.loadAutoFixMode();
    this.chatService.getModels().subscribe({
      next: m => this.models.set(m),
      error: () => this.models.set(this.chatService.getDefaultModels())
    });
  }

  ngAfterViewInit(): void {
    loader.init().then(monaco => {
      this.monaco = monaco;
      this.extensionService.setMonaco(monaco);
      this.completionService.setMonaco(monaco);
      const tab = this.activeTab();
      if (tab) this.initEditor(tab);
    });
  }

  ngOnDestroy(): void {
    this.clearTypewriter();
    this.disposeEditor();
  }

  displayMessage(msg: IdeChatMessage): string {
    if (msg.role === 'user') return msg.content;
    if (msg.animating && msg.displayContent !== undefined) return msg.displayContent;
    return msg.content;
  }

  private appendAssistantMessage(text: string, animate = true): void {
    const plain = stripMarkdown(text);
    if (!animate || plain.length <= 16) {
      this.chatMessages.update(m => [...m, { role: 'assistant', content: plain }]);
      this.scrollChatToBottom();
      return;
    }
    const index = this.chatMessages().length;
    this.chatMessages.update(m => [...m, {
      role: 'assistant',
      content: plain,
      displayContent: '',
      animating: true
    }]);
    this.startTypewriter(index);
  }

  private startTypewriter(messageIndex: number): void {
    this.clearTypewriter();
    const full = this.chatMessages()[messageIndex]?.content ?? '';
    if (!full) return;

    let pos = 0;
    const step = Math.max(1, Math.ceil(full.length / 120));

    this.typewriterTimer = setInterval(() => {
      pos = Math.min(full.length, pos + step);
      const slice = full.slice(0, pos);
      this.chatMessages.update(msgs => msgs.map((m, i) =>
        i === messageIndex ? { ...m, displayContent: slice } : m
      ));
      this.scrollChatToBottom();

      if (pos >= full.length) {
        this.chatMessages.update(msgs => msgs.map((m, i) =>
          i === messageIndex ? { ...m, displayContent: full, animating: false } : m
        ));
        this.clearTypewriter();
        this.scrollChatToBottom();
      }
    }, 18);
  }

  private clearTypewriter(): void {
    if (this.typewriterTimer) {
      clearInterval(this.typewriterTimer);
      this.typewriterTimer = null;
    }
  }

  private scrollChatToBottom(): void {
    setTimeout(() => {
      const el = this.chatMessagesEl()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  setRightPanel(panel: RightPanel): void {
    this.rightPanel.set(panel);
    if (panel === 'git') {
      this.loadGitRepoSuggest();
      if (this.gitConnection()?.connected) {
        this.refreshGitStatus();
      }
    }
  }

  setLeftPanel(panel: LeftPanel): void {
    this.leftPanel.set(panel);
  }

  onExtensionInstalled(extensionId: string): void {
    const tab = this.activeTab();
    if (tab && this.suggestedExtension()?.id === extensionId) {
      this.suggestedExtension.set(null);
      this.refreshEditorLanguage(tab);
    }
  }

  installSuggestedExtension(): void {
    const ext = this.suggestedExtension();
    if (!ext) return;
    this.installingExtension.set(true);
    this.extensionService.install(ext.id).subscribe({
      next: progress => {
        if (progress.phase === 'done') {
          this.installingExtension.set(false);
          this.suggestedExtension.set(null);
          const tab = this.activeTab();
          if (tab) this.refreshEditorLanguage(tab);
        }
        if (progress.phase === 'error') this.installingExtension.set(false);
      },
      error: () => this.installingExtension.set(false)
    });
  }

  dismissExtensionPrompt(): void {
    const ext = this.suggestedExtension();
    if (ext) this.extensionService.dismissSuggestion(ext.id);
    this.suggestedExtension.set(null);
  }

  private refreshEditorLanguage(tab: OpenTab): void {
    if (!this.editor || !this.monaco) return;
    const model = this.editor.getModel();
    if (!model) return;
    this.monaco.editor.setModelLanguage(model, this.resolveLanguage(tab.name));
  }

  private updateSuggestedExtension(filename: string): void {
    this.suggestedExtension.set(this.extensionService.suggestForFile(filename));
  }

  private resolveLanguage(filename: string): string {
    return this.extensionService.resolveLanguage(filename);
  }

  addSelectionToChat(): void {
    const code = this.selectedCode().trim();
    const tab = this.activeTab();
    const range = this.selectedRange();
    if (!code || !tab || !range) return;

    const attachment: ChatCodeAttachment = {
      id: `${tab.path}:${range.startLine}-${range.endLine}:${Date.now()}`,
      kind: 'snippet',
      filePath: tab.path,
      fileId: tab.fileId,
      startLine: range.startLine,
      endLine: range.endLine,
      code
    };

    this.pushChatAttachment(attachment);
    this.setRightPanel('chat');
  }

  onTreeDragStart(event: DragEvent, node: VisibleTreeNode): void {
    if (node.directory) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('application/x-ide-file', JSON.stringify({
      id: node.id,
      path: node.path,
      name: node.name
    }));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }
    this.treeDragging.set(true);
  }

  onTreeDragEnd(): void {
    this.treeDragging.set(false);
  }

  onChatDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.chatDragOver.set(true);
  }

  onChatDragLeave(event: DragEvent): void {
    const related = event.relatedTarget as Node | null;
    const current = event.currentTarget as HTMLElement;
    if (related && current.contains(related)) return;
    this.chatDragOver.set(false);
  }

  onChatDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.chatDragOver.set(false);
    this.treeDragging.set(false);

    const idePayload = event.dataTransfer?.getData('application/x-ide-file');
    if (idePayload) {
      try {
        const { id, path, name } = JSON.parse(idePayload) as { id: number; path: string; name: string };
        this.addFileToChat(id, path, name);
      } catch {
        // ignore invalid payload
      }
      return;
    }

    const file = event.dataTransfer?.files?.[0];
    if (file && !file.type.startsWith('image/')) {
      this.addExternalFileToChat(file);
    }
  }

  addFileToChat(fileId: number, path: string, _name: string): void {
    const tab = this.tabs().find(t => t.fileId === fileId);
    if (tab) {
      this.attachFileContent(fileId, path, tab.content);
      return;
    }
    this.projectService.getFileContent(fileId).subscribe({
      next: file => this.attachFileContent(fileId, path, file.content),
      error: () => this.appendAssistantMessage(`Không đọc được file ${path}.`, false)
    });
  }

  private addExternalFileToChat(file: File): void {
    if (file.size > 512 * 1024) {
      this.appendAssistantMessage(`File ${file.name} quá lớn (tối đa 512KB).`, false);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result ?? '');
      const lines = content.split('\n').length;
      this.pushChatAttachment({
        id: `external:${file.name}:${Date.now()}`,
        kind: 'file',
        filePath: file.name,
        fileId: null,
        startLine: 1,
        endLine: lines,
        code: content
      });
      this.setRightPanel('chat');
    };
    reader.readAsText(file);
  }

  private attachFileContent(fileId: number, path: string, content: string): void {
    const lines = content.split('\n').length;
    const maxLen = 48_000;
    const trimmed = content.length > maxLen
      ? content.slice(0, maxLen) + '\n... (truncated)'
      : content;

    this.pushChatAttachment({
      id: `file:${path}:${Date.now()}`,
      kind: 'file',
      filePath: path,
      fileId,
      startLine: 1,
      endLine: lines,
      code: trimmed
    });
    this.setRightPanel('chat');
  }

  private pushChatAttachment(attachment: ChatCodeAttachment): void {
    this.chatAttachments.update(list => {
      const isDup = (a: ChatCodeAttachment) => {
        if (attachment.kind === 'file' && a.kind === 'file') {
          return a.filePath === attachment.filePath;
        }
        return a.filePath === attachment.filePath
          && a.startLine === attachment.startLine
          && a.endLine === attachment.endLine;
      };
      return [...list.filter(a => !isDup(a)), attachment];
    });
  }

  chatInputPlaceholder(): string {
    if (this.autoFixMode()) {
      return 'Mô tả lỗi cần sửa — kéo thả file vào đây...';
    }
    if (this.chatAttachments().length) {
      return 'Hỏi về file đã đính kèm...';
    }
    return 'Hỏi AI về code — kéo thả file từ cây thư mục...';
  }

  private resolveContextScope(): ContextScope {
    const atts = this.chatAttachments();
    if (atts.length === 1 && atts[0].fileId) return 'FILE';
    if (atts.length > 0) return 'PROJECT';
    return 'PROJECT';
  }

  private resolveChatFileId(): number | null {
    const att = this.chatAttachments().find(a => a.fileId != null);
    return att?.fileId ?? this.activeFileId();
  }

  removeChatAttachment(id: string): void {
    this.chatAttachments.update(list => list.filter(a => a.id !== id));
  }

  private buildOutgoingChatMessage(): string {
    const userText = this.chatInput.trim();
    const attachments = this.chatAttachments();
    if (!attachments.length) return userText;

    const blocks = attachments.map(a => {
      if (a.kind === 'file') {
        return `--- ${a.filePath} (toàn file) ---\n${a.code}`;
      }
      return `--- ${a.filePath} (dòng ${a.startLine}-${a.endLine}) ---\n${a.code}`;
    }).join('\n\n');

    return userText ? `${blocks}\n\n${userText}` : blocks;
  }

  private clearChatDraft(): void {
    this.chatInput = '';
    this.chatAttachments.set([]);
  }

  toggleAutoFix(): void {
    this.autoFixMode.update(v => !v);
    localStorage.setItem(this.autoFixStorageKey(), this.autoFixMode() ? '1' : '0');
    this.setRightPanel('chat');
    this.appendAssistantMessage(
      this.autoFixMode()
        ? 'Chế độ tự sửa: BẬT — AI sửa vào editor, bạn chọn Keep hoặc Undo all.'
        : 'Chế độ tự sửa: TẮT — AI đề xuất, bạn bấm Xem & sửa.',
      false
    );
  }

  private autoFixStorageKey(): string {
    return `ide-autofix-${this.projectId}`;
  }

  private loadAutoFixMode(): void {
    this.autoFixMode.set(localStorage.getItem(this.autoFixStorageKey()) === '1');
  }

  runAutoFix(instruction?: string): void {
    const prompt = instruction?.trim()
      || 'Tự động phát hiện và sửa bug, lỗi logic, security và code smell trong phạm vi context.';
    this.setRightPanel('chat');
    if (instruction?.trim()) {
      this.chatMessages.update(m => [...m, { role: 'user', content: instruction.trim() }]);
    } else {
      this.chatMessages.update(m => [...m, { role: 'user', content: '🩹 Tự sửa code' }]);
    }
    this.aiLoading.set(true);
    this.pendingEditSelection.set(this.getSelectionContext());
    const selection = this.pendingEditSelection();
    this.ideAiService.autoFix(
      this.projectId,
      this.activeFileId(),
      prompt,
      this.resolveContextScope(),
      this.selectedModel,
      selection ?? undefined
    ).subscribe({
      next: res => {
        this.aiLoading.set(false);
        this.handleEditsResponse(res.edits ?? [], stripMarkdown(res.summary || ''));
      },
      error: () => {
        this.aiLoading.set(false);
        this.appendAssistantMessage('Lỗi khi tự sửa.', false);
      }
    });
  }

  private handleEditsResponse(edits: IdeFileEdit[], summary: string): void {
    if (!edits.length) {
      this.appendAssistantMessage(summary || 'Không phát hiện vấn đề cần sửa.', false);
      return;
    }
    this.pendingEdits.set(edits);
    if (this.autoFixMode()) {
      this.stagePendingEdits(summary);
    } else {
      this.appendAssistantMessage(summary || `Đề xuất ${edits.length} thay đổi. Nhấn Xem & sửa bên dưới.`);
    }
  }

  openStagedFile(staged: StagedEdit): void {
    if (staged.fileId) {
      const node = this.flatTree().find(n => n.id === staged.fileId);
      if (node) {
        this.updateTabContent(staged.fileId, staged.path, node.name, staged.newContent, true);
        this.selectTab(staged.fileId);
        return;
      }
    }
    this.appendAssistantMessage(`File mới "${staged.path}" sẽ được tạo khi bấm Keep.`, false);
  }

  loadTree(): void {
    this.projectService.getTree(this.projectId).subscribe(tree => {
      this.tree.set(tree);
      this.flatTree.set(this.flattenTree(tree));
    });
  }

  loadGitConnection(): void {
    this.gitService.getConnection(this.projectId).subscribe({
      next: conn => {
        this.gitConnection.set(conn);
        if (conn.remoteUrl) this.gitRemoteUrl = conn.remoteUrl;
        if (conn.branch) this.gitBranch = conn.branch;
        if (conn.username) this.gitUsername = conn.username;
        if (conn.connected) this.refreshGitStatus();
      },
      error: () => this.gitConnection.set(null)
    });
  }

  loadGitRepoSuggest(): void {
    this.gitService.suggestRepo(this.projectId).subscribe({
      next: suggest => {
        this.gitRepoSuggest.set(suggest);
        if (!this.gitRepoName.trim()) {
          this.gitRepoName = suggest.repoName;
        }
      }
    });
  }

  refreshGitStatus(): void {
    if (!this.gitConnection()?.connected) return;
    this.gitService.getStatus(this.projectId).subscribe({
      next: status => this.gitStatus.set(status),
      error: () => this.gitStatus.set(null)
    });
  }

  onNodeClick(node: VisibleTreeNode): void {
    if (node.directory) {
      this.toggleFolder(node.path);
      return;
    }
    this.openFile(node.id, node.name, node.path);
  }

  toggleFolder(path: string, event?: Event): void {
    event?.stopPropagation();
    this.collapsedDirs.update(set => {
      const next = new Set(set);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  collapseAllFolders(): void {
    const paths = this.flatTree()
      .filter(n => n.directory && (n.children?.length ?? 0) > 0)
      .map(n => n.path);
    this.collapsedDirs.set(new Set(paths));
  }

  expandAllFolders(): void {
    this.collapsedDirs.set(new Set());
  }

  openFileByPath(path: string): void {
    const node = this.flatTree().find(n => n.path === path && !n.directory);
    if (node) this.openFile(node.id, node.name, node.path);
  }

  openFile(fileId: number, name: string, path: string): void {
    const existing = this.tabs().find(t => t.fileId === fileId);
    if (existing) {
      this.selectTab(fileId);
      return;
    }
    this.projectService.getFileContent(fileId).subscribe(file => {
      const tab: OpenTab = { fileId, name, path, content: file.content, dirty: false };
      this.tabs.update(t => [...t, tab]);
      this.selectTab(fileId);
    });
  }

  selectTab(fileId: number): void {
    this.activeFileId.set(fileId);
    const tab = this.tabs().find(t => t.fileId === fileId) ?? null;
    this.activeTab.set(tab);
    if (tab) this.updateSuggestedExtension(tab.name);
    setTimeout(() => {
      this.initEditor(tab);
      this.highlightActiveFile();
    }, 0);
  }

  saveFile(): void {
    const tab = this.activeTab();
    if (!tab || !this.editor) return;
    const content = this.editor.getValue();
    this.projectService.saveFile(tab.fileId, content).subscribe({
      next: file => {
        this.tabs.update(list => list.map(t =>
          t.fileId === tab.fileId ? { ...t, content: file.content, dirty: false } : t
        ));
        this.activeTab.set({ ...tab, content: file.content, dirty: false });
      }
    });
  }

  sendChat(): void {
    if (this.aiLoading()) return;

    const message = this.buildOutgoingChatMessage();
    if (this.autoFixMode()) {
      this.clearChatDraft();
      this.runAutoFix(message || undefined);
      return;
    }

    if (!message) return;
    this.clearChatDraft();
    this.chatMessages.update(m => [...m, { role: 'user', content: message }]);
    this.aiLoading.set(true);
    this.ideAiService.chat(this.projectId, this.resolveChatFileId(), message, this.resolveContextScope(), this.selectedModel).subscribe({
      next: res => {
        this.aiLoading.set(false);
        this.appendAssistantMessage(res.response);
      },
      error: () => {
        this.aiLoading.set(false);
        this.appendAssistantMessage('Lỗi khi gọi AI.', false);
      }
    });
  }

  onChatEnter(event: Event): void {
    const e = event as KeyboardEvent;
    if (!e.shiftKey) {
      e.preventDefault();
      this.sendChat();
    }
  }

  runInline(action: InlineAction): void {
    const code = this.selectedCode();
    if (!code || this.aiLoading()) return;
    const selection = this.getSelectionContext();
    const currentSel = this.editor?.getSelection();
    const savedRange = currentSel && !currentSel.isEmpty() && this.monaco
      ? new this.monaco.Range(
        currentSel.startLineNumber,
        currentSel.startColumn,
        currentSel.endLineNumber,
        currentSel.endColumn
      )
      : null;
    this.setRightPanel('chat');
    const rangeLabel = selection
      ? `dòng ${selection.startLine}-${selection.endLine}`
      : 'đoạn chọn';
    this.chatMessages.update(m => [...m, { role: 'user', content: `[${action}] ${rangeLabel}: ${code.slice(0, 100)}...` }]);
    this.aiLoading.set(true);
    const rangeMeta = selection
      ? { startLine: selection.startLine, endLine: selection.endLine, filePath: selection.filePath }
      : undefined;
    this.ideAiService.inline(this.projectId, this.activeFileId(), code, action, this.selectedModel, rangeMeta).subscribe({
      next: res => {
        if ((action === 'REFACTOR' || action === 'OPTIMIZE') && this.editor && savedRange) {
          const text = extractCodeFromAi(res.response);
          if (text) {
            this.editor.executeEdits('inline-edit', [{
              range: savedRange,
              text,
              forceMoveMarkers: true
            }]);
          }
          this.appendAssistantMessage(`Đã áp dụng ${action} vào vùng đã chọn (dòng ${selection?.startLine}-${selection?.endLine}).`, false);
        } else {
          this.appendAssistantMessage(res.response);
        }
        this.aiLoading.set(false);
      },
      error: () => {
        this.appendAssistantMessage('Lỗi inline AI.', false);
        this.aiLoading.set(false);
      }
    });
  }

  openPrompt(action: PromptAction): void {
    this.promptAction.set(action);
    this.promptInput = '';
  }

  closePrompt(): void {
    this.promptAction.set(null);
    this.promptInput = '';
  }

  promptTitle(): string {
    const map: Record<PromptAction, string> = {
      generate: '✨ Generate Code',
      refactor: '🔧 Refactor',
      multiedit: '📂 Multi-file Edit',
      agent: '🤖 AI Agent',
      review: '🔍 Code Review'
    };
    return map[this.promptAction()!] ?? 'AI';
  }

  promptPlaceholder(): string {
    const map: Record<PromptAction, string> = {
      generate: 'VD: Tạo REST controller cho User...',
      refactor: 'VD: Chuyển field injection sang constructor...',
      multiedit: 'VD: Đổi tên package com.old sang com.new...',
      agent: 'VD: Thêm tính năng đăng nhập JWT...',
      review: 'VD: Review security và performance...'
    };
    return map[this.promptAction()!] ?? '';
  }

  submitPrompt(): void {
    const action = this.promptAction();
    const prompt = this.promptInput.trim();
    if (!action || !prompt || this.aiLoading()) return;
    this.closePrompt();
    this.setRightPanel('chat');
    this.chatMessages.update(m => [...m, { role: 'user', content: prompt }]);
    this.aiLoading.set(true);

    const fileId = this.activeFileId();
    const onText = (text: string) => {
      this.aiLoading.set(false);
      this.appendAssistantMessage(text);
    };
    const onError = () => {
      this.aiLoading.set(false);
      this.appendAssistantMessage('Lỗi khi gọi AI.', false);
    };

    if (action === 'multiedit') {
      this.ideAiService.multiEdit(this.projectId, fileId, prompt, this.selectedModel).subscribe({
        next: res => {
          this.aiLoading.set(false);
          this.handleEditsResponse(res.edits ?? [], stripMarkdown(res.summary || ''));
        },
        error: onError
      });
      return;
    }

    if (action === 'agent') {
      this.ideAiService.agent(this.projectId, fileId, prompt, this.selectedModel).subscribe({
        next: (res: IdeAgentResponse) => {
          const steps = (res.steps ?? []).map(s => `${s.step}. ${s.title}: ${s.detail}`).join('\n');
          const text = [steps, res.result].filter(Boolean).join('\n\n');
          this.aiLoading.set(false);
          if (res.edits?.length) {
            this.handleEditsResponse(res.edits, stripMarkdown(text));
          } else {
            this.appendAssistantMessage(stripMarkdown(text));
          }
        },
        error: onError
      });
      return;
    }

    const call = action === 'generate'
      ? this.ideAiService.generate(this.projectId, fileId, prompt, this.selectedModel)
      : action === 'refactor'
        ? this.ideAiService.refactor(this.projectId, fileId, prompt, this.selectedModel)
        : this.ideAiService.review(this.projectId, fileId, prompt, this.selectedModel);

    call.subscribe({ next: res => onText(res.response), error: onError });
  }

  runArchitecture(): void {
    this.setRightPanel('chat');
    this.aiLoading.set(true);
    this.chatMessages.update(m => [...m, { role: 'user', content: 'Phân tích kiến trúc project' }]);
    this.ideAiService.architecture(this.projectId, this.selectedModel).subscribe({
      next: res => {
        this.aiLoading.set(false);
        this.appendAssistantMessage(res.response);
      },
      error: () => {
        this.aiLoading.set(false);
        this.appendAssistantMessage('Lỗi architecture.', false);
      }
    });
  }

  runSearch(): void {
    const q = this.searchQuery.trim();
    if (!q || this.aiLoading()) return;
    this.aiLoading.set(true);
    this.ideAiService.search(this.projectId, q, this.selectedModel).subscribe({
      next: res => {
        this.searchResults.set(res.results ?? []);
        this.searchSummary.set(stripMarkdown(res.aiSummary ?? ''));
        this.aiLoading.set(false);
      },
      error: () => this.aiLoading.set(false)
    });
  }

  reindexProject(): void {
    this.indexing.set(true);
    this.projectService.indexProject(this.projectId).subscribe({
      next: () => {
        this.indexing.set(false);
        this.setRightPanel('chat');
        this.appendAssistantMessage('Đã index lại project cho RAG/search.', false);
      },
      error: () => this.indexing.set(false)
    });
  }

  stagePendingEdits(priorSummary?: string): void {
    const edits = [...this.pendingEdits()];
    if (!edits.length || this.applyingEdits()) return;
    this.applyingEdits.set(true);
    this.pendingEdits.set([]);
    const lockedSelection = this.pendingEditSelection();

    const loaders = edits.map(edit => this.resolveOriginalForEdit(edit).pipe(
      map(base => {
        const newContent = applyScopedEdit(base.originalContent, edit, lockedSelection);
        return {
          ...base,
          newContent,
          create: edit.create,
          changedLines: getChangedLineNumbers(base.originalContent, newContent)
        };
      })
    ));

    forkJoin(loaders).subscribe({
      next: staged => {
        this.pendingEditSelection.set(null);
        this.stagedEdits.set(staged);
        this.applyingEdits.set(false);
        for (const s of staged) {
          if (s.fileId) {
            const name = s.path.split('/').pop() ?? s.path;
            this.updateTabContent(s.fileId, s.path, name, s.newContent, true);
          }
        }
        const firstOpen = staged.find(s => s.fileId);
        if (firstOpen?.fileId && this.activeFileId() !== firstOpen.fileId) {
          this.selectTab(firstOpen.fileId);
        } else {
          this.highlightActiveFile();
        }
        this.setRightPanel('chat');
        const base = `Đã áp dụng ${staged.length} file vào editor. Dòng vàng = thay đổi.`;
        const msg = priorSummary ? `${priorSummary}\n\n${base}` : base;
        this.appendAssistantMessage(msg, false);
      },
      error: () => {
        this.applyingEdits.set(false);
        this.pendingEdits.set(edits);
        this.pendingEditSelection.set(lockedSelection);
        this.appendAssistantMessage('Lỗi khi áp dụng thay đổi.', false);
      }
    });
  }

  keepAllEdits(): void {
    const staged = [...this.stagedEdits()];
    if (!staged.length || this.applyingEdits()) return;
    this.applyingEdits.set(true);
    let remaining = staged.length;

    const done = () => {
      remaining--;
      if (remaining <= 0) {
        this.applyingEdits.set(false);
        this.clearStagedState();
        this.loadTree();
        this.setRightPanel('chat');
        this.appendAssistantMessage(`Đã giữ (Keep) ${staged.length} file.`, false);
      }
    };

    for (const s of staged) {
      const tab = this.tabs().find(t => t.path === s.path);
      const content = tab?.content ?? s.newContent;

      if (s.create && !s.fileId) {
        const parts = s.path.split('/').filter(Boolean);
        const name = parts.pop()!;
        const parentPath = parts.join('/');
        const parent = parentPath
          ? this.flatTree().find(n => n.path === parentPath && n.directory)
          : undefined;
        this.projectService.createFile(this.projectId, parent?.id ?? null, name, false, content)
          .subscribe({ next: done, error: done });
      } else if (s.fileId) {
        this.projectService.saveFile(s.fileId, content).subscribe({
          next: file => {
            this.tabs.update(list => list.map(t =>
              t.fileId === s.fileId ? { ...t, content: file.content, dirty: false } : t
            ));
            done();
          },
          error: done
        });
      } else {
        done();
      }
    }
  }

  undoAllEdits(): void {
    const staged = [...this.stagedEdits()];
    if (!staged.length || this.applyingEdits()) return;

    for (const s of staged) {
      if (s.fileId) {
        const name = s.path.split('/').pop() ?? s.path;
        this.updateTabContent(s.fileId, s.path, name, s.originalContent, false);
        if (this.activeFileId() === s.fileId) {
          this.editor?.setValue(s.originalContent);
        }
      }
    }

    this.clearStagedState();
    this.setRightPanel('chat');
    this.appendAssistantMessage(`Đã hoàn tác ${staged.length} file.`, false);
  }

  private resolveOriginalForEdit(edit: IdeFileEdit): Observable<Pick<StagedEdit, 'path' | 'fileId' | 'originalContent'>> {
    const node = this.flatTree().find(n => !n.directory && pathsMatch(n.path, edit.path));
    if (node) {
      if (this.activeFileId() === node.id && this.editor) {
        return of({ path: edit.path, fileId: node.id, originalContent: this.editor.getValue() });
      }
      const tab = this.tabs().find(t => t.fileId === node.id);
      if (tab) {
        return of({ path: edit.path, fileId: node.id, originalContent: tab.content });
      }
      return this.projectService.getFileContent(node.id).pipe(
        map(file => ({ path: edit.path, fileId: node.id, originalContent: file.content }))
      );
    }
    return of({ path: edit.path, fileId: null, originalContent: '' });
  }

  private updateTabContent(fileId: number, path: string, name: string, content: string, dirty: boolean): void {
    const existing = this.tabs().find(t => t.fileId === fileId);
    if (existing) {
      this.tabs.update(list => list.map(t =>
        t.fileId === fileId ? { ...t, content, dirty } : t
      ));
      if (this.activeFileId() === fileId) {
        const updated = this.tabs().find(t => t.fileId === fileId)!;
        this.activeTab.set(updated);
        this.editor?.setValue(content);
      }
    } else {
      const tab: OpenTab = { fileId, name, path, content, dirty };
      this.tabs.update(t => [...t, tab]);
    }
  }

  private clearStagedState(): void {
    this.stagedEdits.set([]);
    this.clearEditHighlights();
  }

  private highlightActiveFile(): void {
    const tab = this.activeTab();
    if (!tab) {
      this.clearEditHighlights();
      return;
    }
    const staged = this.stagedEdits().find(s => s.path === tab.path);
    if (staged?.changedLines.length) {
      this.applyEditHighlights(staged.changedLines);
    } else {
      this.clearEditHighlights();
    }
  }

  private applyEditHighlights(lineNumbers: number[]): void {
    if (!this.editor || !this.monaco || !lineNumbers.length) return;
    const decorations = lineNumbers.map(line => ({
      range: new this.monaco!.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'ide-line-modified',
        linesDecorationsClassName: 'ide-line-modified-gutter'
      }
    }));
    this.editDecorationIds = this.editor.deltaDecorations(this.editDecorationIds, decorations);
  }

  private clearEditHighlights(): void {
    if (this.editor) {
      this.editDecorationIds = this.editor.deltaDecorations(this.editDecorationIds, []);
    } else {
      this.editDecorationIds = [];
    }
  }

  connectGit(onSuccess?: () => void): void {
    if (!this.gitToken.trim()) {
      this.gitMessage.set('Nhập GitHub Personal Access Token (ghp_...).');
      this.gitMessageOk.set(false);
      return;
    }

    const manualUrl = this.gitRemoteUrl.trim();
    if (manualUrl) {
      const urlError = this.validateGitRemoteUrl(manualUrl);
      if (urlError) {
        this.gitMessage.set(urlError);
        this.gitMessageOk.set(false);
        return;
      }
    }

    this.gitLoading.set(true);
    this.gitMessage.set('');
    this.gitMessageOk.set(false);
    this.gitService.connect({
      projectId: this.projectId,
      provider: 'github',
      branch: this.gitBranch,
      accessToken: this.gitToken,
      autoCreateRepo: !manualUrl,
      repoName: this.gitRepoName.trim() || undefined,
      privateRepo: this.gitPrivateRepo,
      remoteUrl: manualUrl || undefined,
      username: this.gitUsername.trim() || undefined
    }).subscribe({
      next: conn => {
        this.gitConnection.set(conn);
        if (conn.remoteUrl) this.gitRemoteUrl = conn.remoteUrl;
        if (conn.username) this.gitUsername = conn.username;
        if (conn.repoName) this.gitRepoName = conn.repoName;
        this.gitMessage.set(
          conn.remoteUrl
            ? `Đã tạo/kết nối repo: ${conn.remoteUrl}`
            : 'Đã kết nối GitHub.'
        );
        this.gitMessageOk.set(true);
        this.gitLoading.set(false);
        this.setRightPanel('git');
        this.refreshGitStatus();
        onSuccess?.();
      },
      error: err => {
        this.gitMessage.set(err?.error?.message ?? 'Lỗi kết nối Git.');
        this.gitMessageOk.set(false);
        this.gitLoading.set(false);
      }
    });
  }

  pullGit(): void {
    this.gitLoading.set(true);
    this.gitMessage.set('');
    this.gitMessageOk.set(false);
    this.gitService.pull(this.projectId).subscribe({
      next: res => {
        this.gitMessage.set(res.message || 'Pull thành công.');
        this.gitMessageOk.set(res.success);
        this.gitLoading.set(false);
        if (res.success) {
          this.loadTree();
          this.refreshGitStatus();
        }
      },
      error: err => {
        this.gitMessage.set(err?.error?.message ?? 'Lỗi pull.');
        this.gitMessageOk.set(false);
        this.gitLoading.set(false);
      }
    });
  }

  suggestGitCommitMessage(): void {
    const status = this.gitStatus();
    const summary = status
      ? [
        ...(status.changedFiles ?? []).map(f => `M ${f}`),
        ...(status.untrackedFiles ?? []).map(f => `+ ${f}`),
        status.diffStat ?? ''
      ].filter(Boolean).join('\n')
      : 'IDE code changes';
    this.aiLoading.set(true);
    this.ideAiService.commitMessage(this.projectId, summary, this.selectedModel).subscribe({
      next: res => {
        this.gitCommitMessage = res.response?.trim() || '';
        this.aiLoading.set(false);
      },
      error: () => this.aiLoading.set(false)
    });
  }

  commitAndPushGit(): void {
    if (!this.gitConnection()?.connected) {
      this.setRightPanel('git');
      if (!this.gitToken.trim()) {
        this.gitMessage.set('Nhập token GitHub — IDE sẽ tự tạo repo theo tên project rồi push.');
        this.gitMessageOk.set(false);
        return;
      }
      this.connectGit(() => this.executePush());
      return;
    }
    this.executePush();
  }

  private executePush(): void {
    this.gitLoading.set(true);
    this.gitMessage.set('');
    this.gitMessageOk.set(false);
    this.setRightPanel('git');

    this.saveAllDirtyFiles().subscribe({
      next: () => {
        const msg = this.gitCommitMessage.trim() || undefined;
        this.gitService.push(this.projectId, msg).subscribe({
          next: res => {
            const detail = res.commitMessage ? `Commit: ${res.commitMessage}` : '';
            this.gitMessage.set([detail, res.message].filter(Boolean).join('\n'));
            this.gitMessageOk.set(res.success);
            if (res.commitMessage) this.gitCommitMessage = res.commitMessage;
            this.gitLoading.set(false);
            this.refreshGitStatus();
            this.loadGitConnection();
          },
          error: err => {
            this.gitMessage.set(err?.error?.message ?? 'Lỗi push lên GitHub.');
            this.gitMessageOk.set(false);
            this.gitLoading.set(false);
            this.refreshGitStatus();
          }
        });
      },
      error: () => {
        this.gitMessage.set('Lỗi khi lưu file trước khi push.');
        this.gitMessageOk.set(false);
        this.gitLoading.set(false);
      }
    });
  }

  private validateGitRemoteUrl(raw: string): string | null {
    const url = raw.trim();
    if (!url) {
      return 'Remote URL không được để trống.';
    }
    const match = url.replace(/^https?:\/\//, '').match(/^github\.com\/([^/]+)\/([^/]+)/i);
    if (!match || !match[1] || !match[2]) {
      return 'Remote URL phải đầy đủ dạng: https://github.com/<ten-ban>/<ten-repo> (ví dụ: https://github.com/quanden/my-app).';
    }
    return null;
  }

  private saveAllDirtyFiles(): Observable<void> {
    const dirtyTabs = this.tabs().filter(t => t.dirty);
    if (!dirtyTabs.length) return of(undefined);

    const saves = dirtyTabs.map(tab => {
      const content = tab.fileId === this.activeFileId() && this.editor
        ? this.editor.getValue()
        : tab.content;
      return this.projectService.saveFile(tab.fileId, content).pipe(
        map(file => {
          this.tabs.update(list => list.map(t =>
            t.fileId === tab.fileId ? { ...t, content: file.content, dirty: false } : t
          ));
          if (this.activeFileId() === tab.fileId) {
            this.activeTab.update(t => t ? { ...t, content: file.content, dirty: false } : t);
          }
          return file;
        })
      );
    });

    return forkJoin(saves).pipe(map(() => undefined));
  }

  private initEditor(tab: OpenTab | null): void {
    this.disposeEditor();
    if (!tab) return;
    if (!this.monaco) {
      loader.init().then(monaco => {
        this.monaco = monaco;
        this.extensionService.setMonaco(monaco);
        this.completionService.setMonaco(monaco);
        this.initEditor(tab);
      });
      return;
    }
    const host = this.editorHost()?.nativeElement;
    if (!host) return;

    this.editor = this.monaco.editor.create(host, {
      value: tab.content,
      language: this.resolveLanguage(tab.name),
      theme: this.theme.isDark() ? 'vs-dark' : 'vs',
      automaticLayout: true,
      fontSize: 14,
      minimap: { enabled: true },
      wordWrap: 'on',
      ...getEditorSuggestOptions()
    });

    this.contentChangeDisposable = this.editor.onDidChangeModelContent(() => {
      const fileId = this.activeFileId();
      if (fileId == null) return;
      this.tabs.update(list => list.map(t =>
        t.fileId === fileId ? { ...t, dirty: true } : t
      ));
      const updated = this.tabs().find(t => t.fileId === fileId);
      if (updated) this.activeTab.set(updated);
    });

    this.selectionDisposable = this.editor.onDidChangeCursorSelection(() => this.updateSelectionWidget());
    this.scrollDisposable = this.editor.onDidScrollChange(() => this.updateSelectionWidget());
    this.layoutDisposable = this.editor.onDidLayoutChange(() => this.updateSelectionWidget());

    this.editor.addCommand(
      this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.KeyS,
      () => this.saveFile()
    );

    this.highlightActiveFile();
  }

  private updateSelectionWidget(): void {
    if (!this.editor) {
      this.selectionWidgetVisible.set(false);
      return;
    }

    const selection = this.editor.getSelection();
    const model = this.editor.getModel();
    if (!selection || selection.isEmpty() || !model) {
      this.selectedCode.set('');
      this.selectedRange.set(null);
      this.selectionWidgetVisible.set(false);
      return;
    }

    const code = model.getValueInRange(selection);
    if (!code.trim()) {
      this.selectedCode.set('');
      this.selectedRange.set(null);
      this.selectionWidgetVisible.set(false);
      return;
    }

    this.selectedCode.set(code);
    const startLine = selection.startLineNumber;
    this.selectedRange.set({
      startLine,
      endLine: resolveSelectionEndLine(startLine, code)
    });

    const coords = this.editor.getScrolledVisiblePosition({
      lineNumber: selection.startLineNumber,
      column: selection.startColumn
    });
    if (!coords) {
      this.selectionWidgetVisible.set(false);
      return;
    }

    const widgetHeight = 32;
    const widgetWidth = 420;
    const gap = 6;
    let top = coords.top - widgetHeight - gap;
    let left = coords.left;

    const wrap = this.editorWrap()?.nativeElement;
    if (wrap) {
      left = Math.min(Math.max(4, left), wrap.clientWidth - widgetWidth - 4);
      top = Math.max(4, top);
    }

    this.selectionWidgetPos.set({ top, left });
    this.selectionWidgetVisible.set(true);
  }

  private disposeEditor(): void {
    this.clearEditHighlights();
    this.contentChangeDisposable?.dispose();
    this.contentChangeDisposable = null;
    this.selectionDisposable?.dispose();
    this.selectionDisposable = null;
    this.scrollDisposable?.dispose();
    this.scrollDisposable = null;
    this.layoutDisposable?.dispose();
    this.layoutDisposable = null;
    this.selectionWidgetVisible.set(false);
    this.editor?.dispose();
    this.editor = null;
  }

  terminalPrompt(): string {
    return this.terminalShell === 'powershell' ? 'PS> ' : '$ ';
  }

  toggleTerminal(): void {
    this.terminalOpen.update(v => !v);
    if (this.terminalOpen()) {
      this.terminalLines.set([]);
      this.terminalRunning.set(false);
      this.loadTerminalInfo(true);
      setTimeout(() => {
        this.editor?.layout();
        this.focusTerminalInput();
      }, 80);
    } else {
      setTimeout(() => this.editor?.layout(), 80);
    }
  }

  onTerminalMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('.ide-terminal__body') || target.closest('button') || target.closest('select')) {
      return;
    }
    event.stopPropagation();
    this.focusTerminalInput();
  }

  focusTerminalInput(): void {
    const input = this.terminalInputRef()?.nativeElement;
    if (input && !this.terminalRunning()) {
      input.focus();
    }
  }

  refreshTerminalListing(): void {
    this.terminalService.getInfo(this.projectId).subscribe({
      next: info => {
        this.terminalCwd.set(info.cwd);
        this.showDirectoryListing(info);
        this.scrollTerminalToBottom();
      }
    });
  }

  loadTerminalInfo(showListing = false): void {
    const saved = localStorage.getItem(this.terminalShellStorageKey());
    this.terminalService.getInfo(this.projectId).subscribe({
      next: info => {
        this.terminalShells.set(info.availableShells?.length ? info.availableShells : ['bash']);
        const shells = this.terminalShells();
        if (saved && shells.includes(saved)) {
          this.terminalShell = saved;
        } else {
          this.terminalShell = info.defaultShell || shells[0];
        }
        this.terminalCwd.set(info.cwd);
        this.appendTerminalMeta('Gõ lệnh git hoặc shell — Enter để chạy. Thư mục làm việc:');
        this.appendTerminalLine('meta', info.cwd);
        if (showListing) {
          this.showDirectoryListing(info);
        }
        setTimeout(() => this.focusTerminalInput(), 0);
      },
      error: () => {
        this.appendTerminalLine('error', 'Không tải được thông tin terminal.');
        setTimeout(() => this.focusTerminalInput(), 0);
      }
    });
  }

  private showDirectoryListing(info: { cwd: string; directoryListing?: string }): void {
    this.appendTerminalMeta('--- Nội dung thư mục ---');
    if (info.directoryListing) {
      for (const line of info.directoryListing.split('\n')) {
        this.appendTerminalLine('output', line);
      }
    } else {
      this.appendTerminalLine('meta', '(trống)');
    }
  }

  onTerminalShellChange(): void {
    localStorage.setItem(this.terminalShellStorageKey(), this.terminalShell);
    this.appendTerminalMeta(`Đã chuyển sang ${this.terminalShell === 'powershell' ? 'PowerShell' : 'Bash'}.`);
  }

  clearTerminal(): void {
    this.terminalLines.set([]);
  }

  runTerminalQuick(command: string): void {
    this.terminalInput = command;
    this.runTerminalCommand();
  }

  runTerminalCommand(event?: Event): void {
    event?.preventDefault();
    const command = this.terminalInput.trim();
    if (!command || this.terminalRunning()) return;

    this.terminalHistory.push(command);
    this.terminalHistoryIndex = this.terminalHistory.length;
    this.appendTerminalLine('prompt', `${this.terminalPrompt()}${command}`);
    this.terminalInput = '';
    this.terminalRunning.set(true);

    this.terminalService.exec(this.projectId, command, this.terminalShell).pipe(
      finalize(() => {
        this.terminalRunning.set(false);
        setTimeout(() => this.focusTerminalInput(), 0);
      })
    ).subscribe({
      next: res => {
        const out = res.output?.trimEnd();
        if (out) {
          this.appendTerminalLine('output', out);
        } else if (res.exitCode === 0) {
          this.appendTerminalLine('meta', '(không có output)');
        }
        if (res.exitCode !== 0) {
          this.appendTerminalLine('error', `exit code: ${res.exitCode}`);
        }
        if (res.cwd) this.terminalCwd.set(res.cwd);
        this.scrollTerminalToBottom();
        if (command.startsWith('git') && (command.includes('pull') || command.includes('checkout'))) {
          this.loadTree();
        }
        if (command.startsWith('git') && this.gitConnection()?.connected) {
          this.refreshGitStatus();
        }
        const listCmd = command === 'ls' || command === 'ls -la' || command === 'dir'
          || command.toLowerCase().startsWith('get-childitem');
        if (listCmd) {
          this.refreshTerminalListing();
        }
      },
      error: err => {
        this.appendTerminalLine('error', err?.error?.message ?? 'Lỗi chạy lệnh.');
        this.scrollTerminalToBottom();
      }
    });
  }

  private appendTerminalLine(kind: TerminalLine['kind'], text: string): void {
    this.terminalLines.update(lines => [...lines, { kind, text }]);
  }

  private appendTerminalMeta(text: string): void {
    this.appendTerminalLine('meta', text);
  }

  private scrollTerminalToBottom(): void {
    setTimeout(() => {
      const el = this.terminalOutputEl()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 0);
  }

  private terminalShellStorageKey(): string {
    return `ide-terminal-shell-${this.projectId}`;
  }

  private getSelectionContext(): IdeSelectionContext | null {
    const tab = this.activeTab();
    const range = this.selectedRange();
    const code = this.selectedCode().trim();
    if (tab && range && code) {
      const startLine = range.startLine;
      return {
        startLine,
        endLine: resolveSelectionEndLine(startLine, code),
        selectedCode: code,
        filePath: tab.path
      };
    }
    const snippet = this.chatAttachments().find(a => a.kind === 'snippet' && a.fileId === tab?.fileId);
    if (snippet && tab) {
      const snippetCode = snippet.code.trim();
      const startLine = snippet.startLine;
      return {
        startLine,
        endLine: resolveSelectionEndLine(startLine, snippetCode),
        selectedCode: snippetCode,
        filePath: snippet.filePath
      };
    }
    return null;
  }

  private flattenTree(nodes: FileTreeNode[], depth = 0): Array<FileTreeNode & { depth: number }> {
    const result: Array<FileTreeNode & { depth: number }> = [];
    for (const node of nodes) {
      result.push({ ...node, depth });
      if (node.children?.length) {
        result.push(...this.flattenTree(node.children, depth + 1));
      }
    }
    return result;
  }

  private buildVisibleTree(nodes: FileTreeNode[], collapsed: Set<string>, depth = 0): VisibleTreeNode[] {
    const result: VisibleTreeNode[] = [];
    for (const node of nodes) {
      const hasChildren = node.directory && (node.children?.length ?? 0) > 0;
      const expanded = hasChildren && !collapsed.has(node.path);
      result.push({ ...node, depth, hasChildren, expanded });
      if (hasChildren && expanded) {
        result.push(...this.buildVisibleTree(node.children, collapsed, depth + 1));
      }
    }
    return result;
  }
}
