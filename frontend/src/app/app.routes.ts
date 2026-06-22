import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, adminGuestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), canActivate: [guestGuard] },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent), canActivate: [guestGuard] },
  { path: 'chat', loadComponent: () => import('./features/chat/chat-page/chat-page.component').then(m => m.ChatPageComponent), canActivate: [authGuard] },
  { path: 'prompts', loadComponent: () => import('./features/prompt/prompt-library/prompt-library.component').then(m => m.PromptLibraryComponent), canActivate: [authGuard] },
  { path: 'documents', loadComponent: () => import('./features/document/documents/documents.component').then(m => m.DocumentsComponent), canActivate: [authGuard] },
  { path: 'agent', loadComponent: () => import('./features/agent/agent-page/agent-page.component').then(m => m.AgentPageComponent), canActivate: [authGuard] },
  { path: 'markdown', loadComponent: () => import('./features/markdown/markdown-generator/markdown-generator.component').then(m => m.MarkdownGeneratorComponent), canActivate: [authGuard] },
  { path: 'ppt', loadComponent: () => import('./features/ppt/ppt-generator/ppt-generator.component').then(m => m.PptGeneratorComponent), canActivate: [authGuard] },
  { path: 'workspaces', loadComponent: () => import('./features/ide/workspace-list/workspace-list.component').then(m => m.WorkspaceListComponent), canActivate: [authGuard] },
  { path: 'workspaces/:id', loadComponent: () => import('./features/ide/workspace-detail/workspace-detail.component').then(m => m.WorkspaceDetailComponent), canActivate: [authGuard] },
  { path: 'projects/:id', loadComponent: () => import('./features/ide/project-editor/project-editor.component').then(m => m.ProjectEditorComponent), canActivate: [authGuard] },
  {
    path: 'plugins',
    canActivate: [authGuard],
    loadComponent: () => import('./features/plugin/plugin-layout/plugin-layout.component').then(m => m.PluginLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/plugin/plugin-hub/plugin-hub.component').then(m => m.PluginHubComponent) },
      { path: 'connect', loadComponent: () => import('./features/plugin/plugin-connect/plugin-connect.component').then(m => m.PluginConnectComponent) },
      { path: 'sessions', loadComponent: () => import('./features/plugin/plugin-sessions/plugin-sessions.component').then(m => m.PluginSessionsComponent) },
      { path: 'usage', loadComponent: () => import('./features/plugin/plugin-usage/plugin-usage.component').then(m => m.PluginUsageComponent) },
    ]
  },
  {
    path: 'knowledge',
    canActivate: [authGuard],
    loadComponent: () => import('./features/knowledge/knowledge-layout/knowledge-layout.component').then(m => m.KnowledgeLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/knowledge/knowledge-list/knowledge-list.component').then(m => m.KnowledgeListComponent) },
      { path: 'create', loadComponent: () => import('./features/knowledge/knowledge-create/knowledge-create.component').then(m => m.KnowledgeCreateComponent) },
      { path: ':id', redirectTo: ':id/documents', pathMatch: 'full' },
      { path: ':id/documents', loadComponent: () => import('./features/knowledge/knowledge-documents/knowledge-documents.component').then(m => m.KnowledgeDocumentsComponent) },
      { path: ':id/chat', loadComponent: () => import('./features/knowledge/knowledge-chat/knowledge-chat.component').then(m => m.KnowledgeChatComponent) },
      { path: ':id/settings', loadComponent: () => import('./features/knowledge/knowledge-settings/knowledge-settings.component').then(m => m.KnowledgeSettingsComponent) },
      { path: ':id/analytics', loadComponent: () => import('./features/knowledge/knowledge-analytics/knowledge-analytics.component').then(m => m.KnowledgeAnalyticsComponent) },
    ]
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent),
    canActivate: [adminGuestGuard]
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent) },
      { path: 'users/:id', loadComponent: () => import('./features/admin/admin-user-detail/admin-user-detail.component').then(m => m.AdminUserDetailComponent) },
      { path: 'usages', loadComponent: () => import('./features/admin/admin-usages/admin-usages.component').then(m => m.AdminUsagesComponent) },
      { path: 'conversations', loadComponent: () => import('./features/admin/admin-conversations/admin-conversations.component').then(m => m.AdminConversationsComponent) },
      { path: 'models', loadComponent: () => import('./features/admin/admin-models/admin-models.component').then(m => m.AdminModelsComponent) },
      { path: 'tokens', loadComponent: () => import('./features/admin/admin-tokens/admin-tokens.component').then(m => m.AdminTokensComponent) },
      { path: 'costs', loadComponent: () => import('./features/admin/admin-costs/admin-costs.component').then(m => m.AdminCostsComponent) },
      { path: 'plugins', loadComponent: () => import('./features/admin/admin-plugins/admin-plugins.component').then(m => m.AdminPluginsComponent) },
    ]
  },
  { path: '**', redirectTo: 'chat' }
];
