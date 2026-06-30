import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-plugin-hub',
  imports: [RouterLink],
  template: `
    <div class="feature-container">
      <div class="feature-header">
        <div>
          <h1 class="feature-title">VS Code Plugin</h1>
          <p class="feature-desc">Dùng AI Platform trên VS Code, IntelliJ và các editor khác</p>
        </div>
        <a routerLink="/plugins/connect" class="feature-btn feature-btn--primary">Kết nối extension</a>
      </div>

      <div class="plugin-editor-grid">
        <div class="plugin-editor-card plugin-editor-card--active">
          <h3>VS Code</h3>
          <p>Extension MVP — Chat, Inline AI, Completion, Agent</p>
          <span class="plugin-editor-card__badge">Sẵn sàng</span>
          <a routerLink="/plugins/connect" class="feature-btn feature-btn--sm">Cài đặt</a>
        </div>
        <div class="plugin-editor-card plugin-editor-card--soon">
          <h3>IntelliJ IDEA</h3>
          <p>Android Studio, IntelliJ — Phase 2</p>
          <span class="plugin-editor-card__badge">Sắp ra mắt</span>
        </div>
        <div class="plugin-editor-card plugin-editor-card--soon">
          <h3>Eclipse</h3>
          <p>Phase 3</p>
          <span class="plugin-editor-card__badge">Sắp ra mắt</span>
        </div>
      </div>

      <div class="feature-form-card" style="flex-direction:column;align-items:stretch;margin-top:1.5rem">
        <h3 style="margin:0;font-size:1rem">Cài VS Code extension (bắt buộc trước khi kết nối)</h3>
        <ol style="margin:0.5rem 0 0;padding-left:1.25rem;color:var(--text-secondary);line-height:1.7">
          <li>Build gói: <code>cd vscode-extension && npm run package</code></li>
          <li>VS Code → Extensions → <code>...</code> → <strong>Install from VSIX...</strong></li>
          <li>Chọn file <code>vscode-extension/ai-platform-vscode-0.1.0.vsix</code></li>
          <li>Reload VS Code → Command Palette sẽ có lệnh <strong>AI Platform: Connect with Device Code</strong></li>
        </ol>
      </div>

      <div class="feature-form-card" style="flex-direction:column;align-items:stretch;margin-top:1.5rem">
        <h3 style="margin:0;font-size:1rem">Cách hoạt động</h3>
        <ol style="margin:0.5rem 0 0;padding-left:1.25rem;color:var(--text-secondary);line-height:1.7">
          <li>Cài VS Code extension từ file <code>.vsix</code></li>
          <li>Mở <a routerLink="/plugins/connect">Kết nối</a> trên web để lấy mã 6 ký tự</li>
          <li>Nhập mã trong VS Code → dùng chung tài khoản AI</li>
        </ol>
      </div>
    </div>
  `
})
export class PluginHubComponent {}
