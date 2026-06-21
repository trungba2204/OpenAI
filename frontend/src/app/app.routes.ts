import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

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
  { path: '**', redirectTo: 'chat' }
];
