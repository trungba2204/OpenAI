"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.mimeFromPath = mimeFromPath;
exports.isImagePath = isImagePath;
exports.readWorkspaceFile = readWorkspaceFile;
exports.snippetFromEditor = snippetFromEditor;
exports.attachActiveFile = attachActiveFile;
exports.pickFileAttachment = pickFileAttachment;
exports.pickImageAttachment = pickImageAttachment;
exports.toPluginAttachments = toPluginAttachments;
const vscode = __importStar(require("vscode"));
const MAX_FILE_CHARS = 80000;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const TEXT_EXT = new Set([
    'ts', 'tsx', 'js', 'jsx', 'json', 'md', 'txt', 'java', 'py', 'go', 'rs',
    'html', 'css', 'scss', 'xml', 'yml', 'yaml', 'sql', 'sh', 'vue', 'php', 'cs', 'cpp', 'c', 'h'
]);
const IMAGE_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg']);
function mimeFromPath(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const map = {
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
        webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml'
    };
    return map[ext] || 'application/octet-stream';
}
function isImagePath(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    return IMAGE_EXT.has(ext);
}
async function readWorkspaceFile(uri) {
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
    }
    catch {
        vscode.window.showWarningMessage(`AI Platform: Không đọc được file ${name}`);
        return null;
    }
}
async function readImage(uri, rel, name) {
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
    }
    catch {
        vscode.window.showWarningMessage(`AI Platform: Không đọc được ảnh ${name}`);
        return null;
    }
}
function snippetFromEditor(editor, silent = false) {
    const sel = editor.selection;
    const doc = editor.document;
    const range = sel.isEmpty ? doc.lineAt(sel.active.line).range : sel;
    const code = doc.getText(range);
    if (!code.trim()) {
        if (!silent)
            vscode.window.showWarningMessage('AI Platform: Chọn đoạn code trước');
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
async function attachActiveFile(editor) {
    return readWorkspaceFile(editor.document.uri);
}
async function pickFileAttachment() {
    const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Đính kèm',
        filters: {
            'Code & Text': ['ts', 'tsx', 'js', 'jsx', 'java', 'py', 'go', 'rs', 'json', 'md', 'txt', 'html', 'css', 'xml', 'yml', 'yaml'],
            'Images': ['png', 'jpg', 'jpeg', 'gif', 'webp']
        }
    });
    if (!uris?.[0])
        return null;
    return readWorkspaceFile(uris[0]);
}
async function pickImageAttachment() {
    const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Chọn ảnh',
        filters: { Images: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'] }
    });
    if (!uris?.[0])
        return null;
    return readWorkspaceFile(uris[0]);
}
function toPluginAttachments(items) {
    return items.map(({ id, preview, ...rest }) => rest);
}
//# sourceMappingURL=chatAttachments.js.map