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
exports.extractContext = extractContext;
exports.getSelectedCode = getSelectedCode;
const vscode = __importStar(require("vscode"));
function extractContext() {
    const editor = vscode.window.activeTextEditor;
    const folder = vscode.workspace.workspaceFolders?.[0];
    const ctx = {
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
            const uri = input.uri;
            if (uri?.fsPath)
                return vscode.workspace.asRelativePath(uri);
        }
        return null;
    })
        .filter((f) => !!f)
        .slice(0, 20);
    ctx.openFiles = openFiles;
    return ctx;
}
function getSelectedCode() {
    const editor = vscode.window.activeTextEditor;
    if (!editor)
        return null;
    const sel = editor.selection;
    const text = editor.document.getText(sel.isEmpty ? editor.document.lineAt(sel.active.line).range : sel);
    return {
        code: text,
        startLine: (sel.isEmpty ? sel.active.line : sel.start.line) + 1,
        endLine: (sel.isEmpty ? sel.active.line : sel.end.line) + 1
    };
}
//# sourceMappingURL=contextExtractor.js.map