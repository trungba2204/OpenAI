import * as vscode from 'vscode';
import { AuthManager } from './authManager';
import { ChatViewProvider } from './chatViewProvider';
import { runInlineAction, registerCompletionProvider } from './inlineCommands';

let chatProvider: ChatViewProvider;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const auth = new AuthManager(context);
  await auth.init();

  chatProvider = new ChatViewProvider(auth, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatProvider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('aiPlatform.connect', async () => {
      const ok = await auth.connectWithDeviceCode();
      if (ok) chatProvider.notifyLoggedIn();
    }),
    vscode.commands.registerCommand('aiPlatform.logout', async () => {
      await auth.logout();
      chatProvider.notifyLoggedIn();
      vscode.window.showInformationMessage('AI Platform: Đã đăng xuất');
    }),
    vscode.commands.registerCommand('aiPlatform.chatFocus', async () => {
      await vscode.commands.executeCommand('workbench.view.extension.ai-platform');
      await vscode.commands.executeCommand('aiPlatform.chatView.focus');
    }),
    vscode.commands.registerCommand('aiPlatform.addToChat', () => chatProvider.addSelectionToChat()),
    vscode.commands.registerCommand('aiPlatform.attachFile', async () => {
      await chatProvider.addFileToChat();
    }),
    vscode.commands.registerCommand('aiPlatform.attachImage', async () => {
      await vscode.commands.executeCommand('aiPlatform.chatFocus');
      const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        filters: { Images: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }
      });
      if (uris?.[0]) await chatProvider.addFileToChat(uris[0]);
    }),
    vscode.commands.registerCommand('aiPlatform.addFileToChat', (uri: vscode.Uri) => {
      void chatProvider.addFileToChat(uri);
    }),
    vscode.commands.registerCommand('aiPlatform.explain', () => runInlineAction(auth, 'EXPLAIN')),
    vscode.commands.registerCommand('aiPlatform.refactor', () => runInlineAction(auth, 'REFACTOR')),
    vscode.commands.registerCommand('aiPlatform.fix', () => runInlineAction(auth, 'FIX')),
    vscode.commands.registerCommand('aiPlatform.generateTest', () => runInlineAction(auth, 'GENERATE_TEST')),
    registerCompletionProvider(auth)
  );
}

export function deactivate(): void {}
