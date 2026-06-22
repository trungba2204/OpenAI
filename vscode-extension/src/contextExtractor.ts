import * as vscode from 'vscode';
import { PluginContextPayload } from '@ai-platform/plugin-sdk';

export function extractContext(): PluginContextPayload {
  const editor = vscode.window.activeTextEditor;
  const folder = vscode.workspace.workspaceFolders?.[0];

  const ctx: PluginContextPayload = {
    editorType: 'VSCODE',
    projectName: folder?.name,
    extensionVersion: vscode.extensions.getExtension('ai-platform.ai-platform-vscode')?.packageJSON?.version
  };

  if (editor) {
    const doc = editor.document;
    ctx.activeFile = vscode.workspace.asRelativePath(doc.uri);
    ctx.language = doc.languageId;
    ctx.activeFileContent = doc.getText();

    const sel = editor.selection;
    if (!sel.isEmpty) {
      ctx.selection = {
        startLine: sel.start.line + 1,
        endLine: sel.end.line + 1,
        text: doc.getText(sel)
      };
    }
  }

  const openFiles = vscode.window.tabGroups.all
    .flatMap(g => g.tabs)
    .map(t => {
      const input = t.input;
      if (input && typeof input === 'object' && 'uri' in input) {
        const uri = (input as { uri: vscode.Uri }).uri;
        if (uri?.fsPath) return vscode.workspace.asRelativePath(uri);
      }
      return null;
    })
    .filter((f): f is string => !!f)
    .slice(0, 20);

  ctx.openFiles = openFiles;
  return ctx;
}

export function getSelectedCode(): { code: string; startLine: number; endLine: number } | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return null;
  const sel = editor.selection;
  const text = editor.document.getText(sel.isEmpty ? editor.document.lineAt(sel.active.line).range : sel);
  return {
    code: text,
    startLine: (sel.isEmpty ? sel.active.line : sel.start.line) + 1,
    endLine: (sel.isEmpty ? sel.active.line : sel.end.line) + 1
  };
}
