import * as vscode from 'vscode';
import { PluginAttachment } from '@ai-platform/plugin-sdk';

const MAX_FILE_CHARS = 80_000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const TEXT_EXT = new Set([
  'ts', 'tsx', 'js', 'jsx', 'json', 'md', 'txt', 'java', 'py', 'go', 'rs',
  'html', 'css', 'scss', 'xml', 'yml', 'yaml', 'sql', 'sh', 'vue', 'php', 'cs', 'cpp', 'c', 'h'
]);

const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']);

export interface ChatAttachmentView extends PluginAttachment {
  id: string;
  preview?: string;
}

export function mimeFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml'
  };
  return map[ext] || 'application/octet-stream';
}

export function isImagePath(filePath: string): boolean {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXT.has(ext);
}

export async function readWorkspaceFile(uri: vscode.Uri): Promise<ChatAttachmentView | null> {
  const rel = vscode.workspace.asRelativePath(uri);
  const name = uri.path.split('/').pop() || rel;

  if (isImagePath(name)) {
    return readImage(uri, rel, name);
  }

  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (!TEXT_EXT.has(ext)) {
    vscode.window.showWarningMessage(`AI Platform: Không hỗ trợ đọc file .${ext}`);
    return null;
  }

  try {
    const doc = await vscode.workspace.openTextDocument(uri);
    let content = doc.getText();
    if (content.length > MAX_FILE_CHARS) {
      content = content.slice(0, MAX_FILE_CHARS) + '\n... [truncated]';
    }
    return {
      id: `file:${rel}:${Date.now()}`,
      kind: 'file',
      name,
      path: rel,
      content,
      mimeType: 'text/plain'
    };
  } catch {
    vscode.window.showWarningMessage(`AI Platform: Không đọc được file ${name}`);
    return null;
  }
}

async function readImage(uri: vscode.Uri, rel: string, name: string): Promise<ChatAttachmentView | null> {
  try {
    const bytes = await vscode.workspace.fs.readFile(uri);
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      vscode.window.showWarningMessage('AI Platform: Ảnh quá lớn (tối đa 4MB)');
      return null;
    }
    const mime = mimeFromPath(name);
    const base64 = Buffer.from(bytes).toString('base64');
    return {
      id: `image:${rel}:${Date.now()}`,
      kind: 'image',
      name,
      path: rel,
      content: base64,
      mimeType: mime,
      preview: `data:${mime};base64,${base64}`
    };
  } catch {
    vscode.window.showWarningMessage(`AI Platform: Không đọc được ảnh ${name}`);
    return null;
  }
}

export function snippetFromEditor(editor: vscode.TextEditor, silent = false): ChatAttachmentView | null {
  const sel = editor.selection;
  const doc = editor.document;
  const range = sel.isEmpty ? doc.lineAt(sel.active.line).range : sel;
  const code = doc.getText(range);
  if (!code.trim()) {
    if (!silent) vscode.window.showWarningMessage('AI Platform: Chọn đoạn code trước');
    return null;
  }
  const rel = vscode.workspace.asRelativePath(doc.uri);
  const startLine = range.start.line + 1;
  const endLine = range.end.line + 1;
  return {
    id: `snippet:${rel}:${startLine}-${endLine}:${Date.now()}`,
    kind: 'snippet',
    name: rel.split('/').pop() || rel,
    path: rel,
    startLine,
    endLine,
    content: code,
    mimeType: 'text/plain'
  };
}

export async function attachActiveFile(editor: vscode.TextEditor): Promise<ChatAttachmentView | null> {
  return readWorkspaceFile(editor.document.uri);
}

export async function pickFileAttachment(): Promise<ChatAttachmentView | null> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: 'Đính kèm',
    filters: {
      'Code & Text': ['ts', 'tsx', 'js', 'jsx', 'java', 'py', 'go', 'rs', 'json', 'md', 'txt', 'html', 'css', 'xml', 'yml', 'yaml'],
      'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp']
    }
  });
  if (!uris?.[0]) return null;
  return readWorkspaceFile(uris[0]);
}

export async function pickImageAttachment(): Promise<ChatAttachmentView | null> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: 'Chọn ảnh',
    filters: { Images: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }
  });
  if (!uris?.[0]) return null;
  return readWorkspaceFile(uris[0]);
}

export function toPluginAttachments(items: ChatAttachmentView[]): PluginAttachment[] {
  return items.map(({ id, preview, ...rest }) => rest);
}
