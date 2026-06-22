import * as vscode from 'vscode';
import { AuthManager } from './authManager';
import { extractContext, getSelectedCode } from './contextExtractor';

export async function runInlineAction(auth: AuthManager, action: string): Promise<void> {
  if (!auth.isLoggedIn()) {
    const ok = await vscode.window.showWarningMessage(
      'Chưa đăng nhập AI Platform',
      'Kết nối'
    );
    if (ok) await vscode.commands.executeCommand('aiPlatform.connect');
    return;
  }

  const sel = getSelectedCode();
  if (!sel?.code) {
    vscode.window.showWarningMessage('Chọn đoạn code trước');
    return;
  }

  await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `AI Platform: ${action}` }, async () => {
    try {
      const res = await auth.api.inline({
        action,
        code: sel.code,
        startLine: sel.startLine,
        endLine: sel.endLine,
        context: extractContext()
      });

      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const actionLabel = action.toLowerCase();
      const choice = await vscode.window.showInformationMessage(
        `AI ${actionLabel} xong`,
        'Áp dụng',
        'Sao chép'
      );

      if (choice === 'Áp dụng') {
        const range = editor.selection.isEmpty
          ? editor.document.lineAt(editor.selection.active.line).range
          : editor.selection;
        await editor.edit(eb => eb.replace(range, res.result));
      } else if (choice === 'Sao chép') {
        await vscode.env.clipboard.writeText(res.result);
      }
    } catch (e) {
      vscode.window.showErrorMessage(`Lỗi: ${e instanceof Error ? e.message : e}`);
    }
  });
}

export function registerCompletionProvider(auth: AuthManager): vscode.Disposable {
  const langs = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'java', 'python', 'go', 'rust', 'html', 'css', 'json'];

  return vscode.languages.registerInlineCompletionItemProvider(
    langs.map(l => ({ language: l })),
    {
      provideInlineCompletionItems: async (document, position, _ctx, token) => {
        if (!auth.isLoggedIn()) return undefined;

        const line = document.lineAt(position.line).text;
        const prefix = line.substring(0, position.character);
        if (prefix.trim().length < 3) return undefined;

        const suffix = line.substring(position.character);
        const debounce = 400;
        await new Promise(r => setTimeout(r, debounce));
        if (token.isCancellationRequested) return undefined;

        try {
          const res = await auth.api.completion({
            prefix,
            suffix,
            context: {
              ...extractContext(),
              activeFile: vscode.workspace.asRelativePath(document.uri),
              language: document.languageId
            }
          });
          if (!res.completion?.trim()) return undefined;
          return [
            new vscode.InlineCompletionItem(
              res.completion,
              new vscode.Range(position, position)
            )
          ];
        } catch {
          return undefined;
        }
      }
    }
  );
}
