import * as vscode from 'vscode';
import { AuthManager } from './authManager';
import { extractContext } from './contextExtractor';
import { extractApplicableCode, looksLikePartialSnippet } from './codeUtils';
import {
  AiModelInfo,
  PluginAttachment,
  PluginChatMode
} from '@ai-platform/plugin-sdk';
import { getChatHtml } from './chatHtml';
import {
  ChatAttachmentView,
  pickFileAttachment,
  pickImageAttachment,
  readWorkspaceFile,
  snippetFromEditor
} from './chatAttachments';

const DEFAULT_MODELS: AiModelInfo[] = [
  { id: 'GROQ_LLAMA_70B', modelId: 'llama-3.3-70b-versatile', displayName: 'Llama 3.3 70B (Free)' },
  { id: 'OR_DEEPSEEK_CHAT', modelId: 'deepseek/deepseek-chat', displayName: 'OR DeepSeek Chat' },
  { id: 'OR_GPT4O_MINI', modelId: 'openai/gpt-4o-mini', displayName: 'OR GPT-4o Mini' }
];

interface UndoState {
  uri: vscode.Uri;
  range: vscode.Range;
  original: string;
}

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'aiPlatform.chatView';
  private view?: vscode.WebviewView;
  private webviewReady = false;
  private pendingAttachments: ChatAttachmentView[] = [];
  private models: AiModelInfo[] = DEFAULT_MODELS;
  private pendingEditTarget: PluginAttachment | null = null;
  private lastUndo: UndoState | null = null;
  private highlightDeco?: vscode.TextEditorDecorationType;

  constructor(private auth: AuthManager, private context: vscode.ExtensionContext) {
    this.highlightDeco = vscode.window.createTextEditorDecorationType({
      backgroundColor: new vscode.ThemeColor('diffEditor.insertedLineBackground'),
      isWholeLine: true
    });
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getChatHtml();
    this.webviewReady = false;

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) void this.bootstrap();
    });

    webviewView.webview.onDidReceiveMessage(async msg => {
      switch (msg.type) {
        case 'send':
          await this.handleSend(msg.text, msg.mode, msg.model, msg.attachments);
          break;
        case 'applyEdit':
          await this.applyEdit(msg.result, false);
          break;
        case 'undoEdit':
          await this.undoLastEdit();
          break;
        case 'savePrefs':
          await this.context.globalState.update('chatMode', msg.mode);
          await this.context.globalState.update('chatModel', msg.model);
          break;
        case 'ready':
          this.webviewReady = true;
          await this.bootstrap();
          this.flushPendingAttachments();
          break;
        case 'pickFile': {
          const att = await pickFileAttachment();
          if (att) this.pushAttachment(att);
          break;
        }
        case 'pickImage': {
          const att = await pickImageAttachment();
          if (att) this.pushAttachment(att);
          break;
        }
      }
    });
  }

  async addSelectionToChat(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('AI Platform: Mở file code trước');
      return;
    }
    const att = snippetFromEditor(editor);
    if (!att) return;
    await this.ensureChatVisible();
    this.pushAttachment(att);
    void vscode.window.showTextDocument(editor.document, editor.viewColumn);
    vscode.window.setStatusBarMessage('AI Platform: Đã thêm code vào chat', 2000);
  }

  async addFileToChat(uri?: vscode.Uri): Promise<void> {
    if (!uri && vscode.window.activeTextEditor) {
      uri = vscode.window.activeTextEditor.document.uri;
    }
    if (!uri) {
      vscode.window.showWarningMessage('AI Platform: Chọn file trước');
      return;
    }
    const att = await readWorkspaceFile(uri);
    if (!att) return;
    await this.ensureChatVisible();
    this.pushAttachment(att);
    vscode.window.setStatusBarMessage(`AI Platform: Đã thêm ${att.name}`, 2000);
  }

  private async ensureChatVisible(): Promise<void> {
    await vscode.commands.executeCommand('workbench.view.extension.ai-platform');
    await vscode.commands.executeCommand('aiPlatform.chatView.focus');
    for (let i = 0; i < 20 && !this.webviewReady; i++) {
      await sleep(50);
    }
  }

  private pushAttachment(att: ChatAttachmentView): void {
    if (this.webviewReady && this.view?.webview) {
      this.view.webview.postMessage({ type: 'addAttachment', attachment: att });
    } else {
      this.pendingAttachments.push(att);
    }
    this.flushPendingAttachments();
  }

  private flushPendingAttachments(): void {
    if (!this.webviewReady || !this.view?.webview) return;
    while (this.pendingAttachments.length > 0) {
      const att = this.pendingAttachments.shift()!;
      this.view.webview.postMessage({ type: 'addAttachment', attachment: att });
    }
  }

  private async bootstrap(): Promise<void> {
    if (this.auth.isLoggedIn()) {
      try {
        this.models = await this.auth.api.listModels();
      } catch {
        this.models = DEFAULT_MODELS;
      }
    }
    this.view?.webview.postMessage({
      type: 'init',
      loggedIn: this.auth.isLoggedIn(),
      models: this.models,
      mode: this.context.globalState.get<PluginChatMode>('chatMode', 'ask'),
      model: this.context.globalState.get<string>('chatModel', 'GROQ_LLAMA_70B')
    });
  }

  notifyLoggedIn(): void {
    void this.bootstrap();
  }

  private resolveCodeAttachment(attachments: PluginAttachment[]): {
    codeAtt: PluginAttachment | null;
    all: PluginAttachment[];
  } {
    let all = [...attachments];
    let codeAtt = all.find(a => a.kind === 'snippet') || all.find(a => a.kind === 'file') || null;

    if (!codeAtt) {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        const auto = snippetFromEditor(editor, true);
        if (auto && !editor.selection.isEmpty) {
          codeAtt = auto;
          all = [...all, auto];
        } else if (editor.document.uri.scheme === 'file') {
          const rel = vscode.workspace.asRelativePath(editor.document.uri);
          const full: PluginAttachment = {
            kind: 'file',
            name: rel.split('/').pop() || rel,
            path: rel,
            content: editor.document.getText().slice(0, 80_000),
            mimeType: 'text/plain'
          };
          codeAtt = full;
          all = [...all, full];
        }
      }
    }
    return { codeAtt, all };
  }

  private async handleSend(
    text: string,
    mode: PluginChatMode,
    model: string,
    attachments: PluginAttachment[] = []
  ): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this.streamReply('Chưa đăng nhập. Dùng lệnh **AI Platform: Connect with Device Code**.');
      return;
    }

    const trimmed = text?.trim() || '';
    if (!trimmed && attachments.length === 0) {
      this.streamReply('Nhập câu hỏi hoặc đính kèm file/code.');
      return;
    }

    this.postTyping(true);
    const ctx = extractContext();

    try {
      if (mode === 'ask') {
        const { all } = this.resolveCodeAttachment(attachments);
        const res = await this.auth.api.chat({ message: trimmed, model, context: ctx, attachments: all });
        this.streamReply(res.answer);
      } else if (mode === 'plan') {
        const { all } = this.resolveCodeAttachment(attachments);
        const res = await this.auth.api.agent({ message: trimmed, model, context: ctx, attachments: all });
        this.streamReply(res.answer);
      } else {
        const { codeAtt, all } = this.resolveCodeAttachment(attachments);
        if (!codeAtt?.content) {
          this.streamReply('**Chế độ Sửa:** bôi đen code → *Add to Chat*, hoặc mở file cần sửa rồi gửi.');
          return;
        }
        const res = await this.auth.api.inline({
          action: 'EDIT',
          instruction: trimmed || 'Cải thiện code theo best practices',
          code: codeAtt.content,
          startLine: codeAtt.startLine,
          endLine: codeAtt.endLine,
          model,
          context: ctx,
          attachments: all
        });

        let code = extractApplicableCode(res.result);
        if (looksLikePartialSnippet(code, codeAtt.content)) {
          this.streamReply(
            '⚠️ AI trả về đoạn ngắn, có thể chưa đủ. Thử model **OR GPT-4o Mini** hoặc bôi đen đúng vùng cần sửa.\n\n```\n' + code + '\n```',
            false,
            true
          );
          return;
        }

        this.pendingEditTarget = codeAtt;
        const applied = await this.applyEdit(code, true);
        if (applied) {
          const preview = code.length > 600 ? code.slice(0, 600) + '\n...' : code;
          this.streamReply(
            '✅ **Đã áp dụng vào editor** — vùng sửa được highlight.\n\n```\n' + preview + '\n```\n\n*Hoàn tác:* bấm nút bên dưới hoặc `Cmd+Z`',
            false,
            true
          );
        } else {
          this.streamReply('```\n' + code + '\n```', true, true);
        }
      }
    } catch (e) {
      this.streamReply(`**Lỗi:** ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      this.postTyping(false);
    }
  }

  private getEditRange(editor: vscode.TextEditor, target: PluginAttachment): vscode.Range {
    if (target.kind === 'snippet' && target.startLine && target.endLine) {
      const endLine = editor.document.lineAt(Math.min(target.endLine - 1, editor.document.lineCount - 1));
      return new vscode.Range(target.startLine - 1, 0, target.endLine - 1, endLine.text.length);
    }
    if (target.kind === 'file') {
      const last = editor.document.lineAt(editor.document.lineCount - 1);
      return new vscode.Range(0, 0, last.lineNumber, last.text.length);
    }
    const sel = editor.selection;
    return sel.isEmpty ? editor.document.lineAt(sel.active.line).range : sel;
  }

  private async applyEdit(result: string, auto: boolean): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      if (!auto) vscode.window.showWarningMessage('Không có editor đang mở');
      return false;
    }
    const target = this.pendingEditTarget;
    if (!target) {
      if (!auto) vscode.window.showWarningMessage('Không xác định được vùng sửa');
      return false;
    }

    const code = extractApplicableCode(result);
    const range = this.getEditRange(editor, target);
    const original = editor.document.getText(range);

    const ok = await editor.edit(eb => eb.replace(range, code));
    if (!ok) return false;

    this.lastUndo = { uri: editor.document.uri, range, original };
    this.highlightApplied(editor, range);

    if (auto) {
      const choice = await vscode.window.showInformationMessage(
        'AI Platform: Đã áp dụng sửa code',
        'Hoàn tác'
      );
      if (choice === 'Hoàn tác') await this.undoLastEdit();
    } else {
      vscode.window.showInformationMessage('AI Platform: Đã áp dụng sửa code');
    }
    return true;
  }

  private async undoLastEdit(): Promise<void> {
    if (!this.lastUndo) return;
    const doc = await vscode.workspace.openTextDocument(this.lastUndo.uri);
    const editor = await vscode.window.showTextDocument(doc);
    const { range, original } = this.lastUndo;
    await editor.edit(eb => eb.replace(range, original));
    this.lastUndo = null;
    vscode.window.setStatusBarMessage('AI Platform: Đã hoàn tác', 2000);
  }

  private highlightApplied(editor: vscode.TextEditor, range: vscode.Range): void {
    if (!this.highlightDeco) return;
    editor.setDecorations(this.highlightDeco, [range]);
    setTimeout(() => editor.setDecorations(this.highlightDeco!, []), 8000);
  }

  private streamReply(text: string, canApply = false, showUndo = false): void {
    this.view?.webview.postMessage({ type: 'stream', text, canApply, showUndo, animate: true });
  }

  private postTyping(on: boolean): void {
    this.view?.webview.postMessage({ type: 'typing', on });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
