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
exports.runInlineAction = runInlineAction;
exports.registerCompletionProvider = registerCompletionProvider;
const vscode = __importStar(require("vscode"));
const contextExtractor_1 = require("./contextExtractor");
async function runInlineAction(auth, action) {
    if (!auth.isLoggedIn()) {
        const ok = await vscode.window.showWarningMessage('Chưa đăng nhập AI Platform', 'Kết nối');
        if (ok)
            await vscode.commands.executeCommand('aiPlatform.connect');
        return;
    }
    const sel = (0, contextExtractor_1.getSelectedCode)();
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
                context: (0, contextExtractor_1.extractContext)()
            });
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const actionLabel = action.toLowerCase();
            const choice = await vscode.window.showInformationMessage(`AI ${actionLabel} xong`, 'Áp dụng', 'Sao chép');
            if (choice === 'Áp dụng') {
                const range = editor.selection.isEmpty
                    ? editor.document.lineAt(editor.selection.active.line).range
                    : editor.selection;
                await editor.edit(eb => eb.replace(range, res.result));
            }
            else if (choice === 'Sao chép') {
                await vscode.env.clipboard.writeText(res.result);
            }
        }
        catch (e) {
            vscode.window.showErrorMessage(`Lỗi: ${e instanceof Error ? e.message : e}`);
        }
    });
}
function registerCompletionProvider(auth) {
    const langs = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact', 'java', 'python', 'go', 'rust', 'html', 'css', 'json'];
    return vscode.languages.registerInlineCompletionItemProvider(langs.map(l => ({ language: l })), {
        provideInlineCompletionItems: async (document, position, _ctx, token) => {
            if (!auth.isLoggedIn())
                return undefined;
            const line = document.lineAt(position.line).text;
            const prefix = line.substring(0, position.character);
            if (prefix.trim().length < 3)
                return undefined;
            const suffix = line.substring(position.character);
            const debounce = 400;
            await new Promise(r => setTimeout(r, debounce));
            if (token.isCancellationRequested)
                return undefined;
            try {
                const res = await auth.api.completion({
                    prefix,
                    suffix,
                    context: {
                        ...(0, contextExtractor_1.extractContext)(),
                        activeFile: vscode.workspace.asRelativePath(document.uri),
                        language: document.languageId
                    }
                });
                if (!res.completion?.trim())
                    return undefined;
                return [
                    new vscode.InlineCompletionItem(res.completion, new vscode.Range(position, position))
                ];
            }
            catch {
                return undefined;
            }
        }
    });
}
//# sourceMappingURL=inlineCommands.js.map