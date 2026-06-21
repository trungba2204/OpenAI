import { Injectable } from '@angular/core';
import type * as Monaco from 'monaco-editor';
import {
  extractDocumentSymbols,
  LANGUAGE_BUILTINS,
  LANGUAGE_KEYWORDS
} from '../utils/ide-completion';

const SUPPORTED_LANGUAGES = [
  'typescript', 'javascript', 'java', 'python', 'go', 'rust', 'csharp', 'cpp',
  'php', 'ruby', 'kotlin', 'swift', 'sql', 'html', 'css', 'scss', 'yaml',
  'xml', 'shell', 'dockerfile', 'markdown', 'json', 'plaintext'
];

@Injectable({ providedIn: 'root' })
export class IdeCompletionService {
  private monaco: typeof Monaco | null = null;
  private disposables: Monaco.IDisposable[] = [];
  private registered = false;

  setMonaco(monaco: typeof Monaco): void {
    if (this.registered && this.monaco === monaco) return;
    this.dispose();
    this.monaco = monaco;
    this.registerAll();
    this.registered = true;
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.disposables = [];
    this.registered = false;
  }

  private registerAll(): void {
    if (!this.monaco) return;
    const monaco = this.monaco;

    for (const languageId of SUPPORTED_LANGUAGES) {
      this.disposables.push(
        monaco.languages.registerCompletionItemProvider(languageId, {
          triggerCharacters: ['.', ':', '@', '#', '<', '"', "'", '(', ' '],
          provideCompletionItems: (model, position) => {
            return this.buildSuggestions(monaco, model, position, languageId);
          }
        })
      );
    }
  }

  private buildSuggestions(
    monaco: typeof Monaco,
    model: Monaco.editor.ITextModel,
    position: Monaco.Position,
    languageId: string
  ): Monaco.languages.ProviderResult<Monaco.languages.CompletionList> {
    const word = model.getWordUntilPosition(position);
    const range: Monaco.IRange = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn
    };

    const prefix = (word.word || '').toLowerCase();
    const text = model.getValue();
    const suggestions: Monaco.languages.CompletionItem[] = [];
    const used = new Set<string>();

    const add = (item: Omit<Monaco.languages.CompletionItem, 'range'>) => {
      const key = `${item.kind}:${String(item.label)}`;
      if (used.has(key)) return;
      used.add(key);
      suggestions.push({ ...item, range });
    };

    for (const kw of LANGUAGE_KEYWORDS[languageId] ?? []) {
      if (prefix && !kw.toLowerCase().startsWith(prefix)) continue;
      add({
        label: kw,
        kind: monaco.languages.CompletionItemKind.Keyword,
        insertText: kw,
        detail: 'keyword',
        sortText: `2_${kw}`
      });
    }

    for (const builtin of LANGUAGE_BUILTINS[languageId] ?? []) {
      if (prefix && !builtin.toLowerCase().startsWith(prefix)) continue;
      add({
        label: builtin,
        kind: monaco.languages.CompletionItemKind.Module,
        insertText: builtin,
        detail: 'builtin',
        sortText: `3_${builtin}`
      });
    }

    for (const sym of extractDocumentSymbols(text)) {
      if (prefix && !sym.name.toLowerCase().startsWith(prefix)) continue;
      add({
        label: sym.name,
        kind: sym.kind,
        insertText: sym.name,
        detail: sym.detail ?? 'symbol',
        sortText: `0_${sym.name}`
      });
    }

    const line = model.getLineContent(position.lineNumber);
    const before = line.slice(0, position.column - 1);
    if (before.endsWith('.')) {
      const objectExpr = before.slice(0, -1).trim().split(/\s+/).pop() ?? '';
      const members = this.guessMembers(objectExpr, languageId);
      for (const m of members) {
        add({
          label: m,
          kind: monaco.languages.CompletionItemKind.Method,
          insertText: m,
          detail: 'member',
          sortText: `1_${m}`
        });
      }
    }

    return { suggestions };
  }

  private guessMembers(objectExpr: string, languageId: string): string[] {
    const lower = objectExpr.toLowerCase();
    if (lower === 'console' && (languageId === 'javascript' || languageId === 'typescript')) {
      return ['log', 'error', 'warn', 'info', 'debug', 'table', 'time', 'timeEnd'];
    }
    if (lower === 'system' && languageId === 'java') {
      return ['out', 'err', 'in', 'getenv', 'currentTimeMillis'];
    }
    if (lower === 'string' || lower.endsWith('str')) {
      return ['length', 'slice', 'substring', 'indexOf', 'toLowerCase', 'toUpperCase', 'trim', 'split'];
    }
    if (lower === 'array' || lower.endsWith('list') || lower.endsWith('arr')) {
      return ['length', 'push', 'pop', 'map', 'filter', 'forEach', 'find', 'includes', 'slice'];
    }
    if (lower === 'math') {
      return ['abs', 'ceil', 'floor', 'round', 'max', 'min', 'random', 'sqrt'];
    }
    if (lower === 'json') {
      return ['parse', 'stringify'];
    }
    if (lower === 'document' && (languageId === 'javascript' || languageId === 'typescript')) {
      return ['getElementById', 'querySelector', 'querySelectorAll', 'createElement'];
    }
    return [];
  }
}
