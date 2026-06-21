import type * as Monaco from 'monaco-editor';

export const LANGUAGE_KEYWORDS: Record<string, string[]> = {
  typescript: [
    'abstract', 'any', 'as', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
    'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'from', 'function', 'if', 'implements', 'import', 'in',
    'instanceof', 'interface', 'let', 'new', 'null', 'of', 'package', 'private', 'protected',
    'public', 'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'type',
    'typeof', 'undefined', 'var', 'void', 'while', 'yield', 'readonly', 'keyof', 'never', 'unknown'
  ],
  javascript: [
    'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 'finally', 'for',
    'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null', 'of', 'return',
    'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined',
    'var', 'void', 'while', 'yield'
  ],
  java: [
    'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
    'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
    'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
    'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
    'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
    'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null',
    'var', 'record', 'sealed', 'permits', 'yield'
  ],
  python: [
    'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del',
    'elif', 'else', 'except', 'False', 'finally', 'for', 'from', 'global', 'if', 'import',
    'in', 'is', 'lambda', 'None', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
    'True', 'try', 'while', 'with', 'yield', 'self'
  ],
  go: [
    'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough',
    'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range',
    'return', 'select', 'struct', 'switch', 'type', 'var', 'true', 'false', 'nil', 'iota'
  ],
  rust: [
    'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum',
    'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod',
    'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super',
    'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while', 'yield'
  ],
  csharp: [
    'abstract', 'as', 'async', 'await', 'base', 'bool', 'break', 'case', 'catch', 'char',
    'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
    'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for',
    'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock',
    'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params',
    'private', 'protected', 'public', 'readonly', 'ref', 'return', 'sealed', 'short', 'sizeof',
    'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 'try',
    'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'var', 'virtual',
    'void', 'volatile', 'while', 'yield', 'record'
  ],
  cpp: [
    'alignas', 'alignof', 'and', 'auto', 'bool', 'break', 'case', 'catch', 'char', 'class',
    'const', 'constexpr', 'continue', 'decltype', 'default', 'delete', 'do', 'double', 'else',
    'enum', 'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto', 'if',
    'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'not', 'nullptr', 'operator',
    'or', 'private', 'protected', 'public', 'register', 'return', 'short', 'signed', 'sizeof',
    'static', 'struct', 'switch', 'template', 'this', 'throw', 'true', 'try', 'typedef',
    'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'while'
  ],
  php: [
    'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class', 'clone',
    'const', 'continue', 'declare', 'default', 'do', 'echo', 'else', 'elseif', 'empty', 'enddeclare',
    'endfor', 'endforeach', 'endif', 'endswitch', 'endwhile', 'enum', 'eval', 'exit', 'extends',
    'false', 'final', 'finally', 'fn', 'for', 'foreach', 'function', 'global', 'goto', 'if',
    'implements', 'include', 'include_once', 'instanceof', 'insteadof', 'interface', 'isset',
    'list', 'match', 'namespace', 'new', 'null', 'or', 'print', 'private', 'protected', 'public',
    'readonly', 'require', 'require_once', 'return', 'static', 'switch', 'throw', 'trait', 'true',
    'try', 'unset', 'use', 'var', 'while', 'xor', 'yield', 'self', 'parent'
  ],
  ruby: [
    'BEGIN', 'END', 'alias', 'and', 'begin', 'break', 'case', 'class', 'def', 'defined?',
    'do', 'else', 'elsif', 'end', 'ensure', 'false', 'for', 'if', 'in', 'module', 'next', 'nil',
    'not', 'or', 'redo', 'rescue', 'retry', 'return', 'self', 'super', 'then', 'true', 'undef',
    'unless', 'until', 'when', 'while', 'yield'
  ],
  kotlin: [
    'abstract', 'actual', 'annotation', 'as', 'break', 'by', 'catch', 'class', 'companion',
    'const', 'constructor', 'continue', 'crossinline', 'data', 'delegate', 'do', 'dynamic',
    'else', 'enum', 'expect', 'external', 'false', 'field', 'final', 'finally', 'for', 'fun',
    'if', 'import', 'in', 'infix', 'init', 'inline', 'inner', 'interface', 'internal', 'is',
    'lateinit', 'noinline', 'null', 'object', 'open', 'operator', 'out', 'override', 'package',
    'private', 'protected', 'public', 'reified', 'return', 'sealed', 'super', 'suspend',
    'tailrec', 'this', 'throw', 'true', 'try', 'typealias', 'typeof', 'val', 'var', 'vararg',
    'when', 'where', 'while'
  ],
  swift: [
    'associatedtype', 'break', 'case', 'catch', 'class', 'continue', 'default', 'defer', 'deinit',
    'do', 'else', 'enum', 'extension', 'fallthrough', 'false', 'fileprivate', 'final', 'for',
    'func', 'guard', 'if', 'import', 'in', 'init', 'inout', 'internal', 'is', 'let', 'mutating',
    'nil', 'open', 'operator', 'private', 'protocol', 'public', 'repeat', 'rethrows', 'return',
    'self', 'Self', 'static', 'struct', 'subscript', 'super', 'switch', 'throw', 'throws', 'true',
    'try', 'typealias', 'var', 'where', 'while'
  ],
  sql: [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'JOIN',
    'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING', 'LIMIT',
    'OFFSET', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'CREATE', 'TABLE', 'ALTER', 'DROP', 'INDEX',
    'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'DEFAULT', 'DISTINCT', 'COUNT', 'SUM',
    'AVG', 'MAX', 'MIN', 'LIKE', 'IN', 'BETWEEN', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END'
  ],
  html: [
    'html', 'head', 'body', 'title', 'meta', 'link', 'script', 'style', 'div', 'span', 'p',
    'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'form', 'input', 'button',
    'label', 'select', 'option', 'textarea', 'header', 'footer', 'nav', 'section', 'article', 'main'
  ],
  css: [
    'color', 'background', 'margin', 'padding', 'border', 'display', 'flex', 'grid', 'width',
    'height', 'font-size', 'font-weight', 'position', 'absolute', 'relative', 'fixed', 'top',
    'left', 'right', 'bottom', 'z-index', 'opacity', 'transform', 'transition', 'animation',
    'justify-content', 'align-items', 'flex-direction', 'gap', 'overflow', 'text-align'
  ],
  scss: [
    'color', 'background', 'margin', 'padding', 'border', 'display', 'flex', 'width', 'height',
    '@mixin', '@include', '@extend', '@import', '@use', '@forward', '@function', '@if', '@else',
    '@for', '@each', '@while', '@media', '@keyframes'
  ],
  yaml: ['true', 'false', 'null', 'yes', 'no'],
  xml: [],
  shell: [
    'if', 'then', 'else', 'elif', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function',
    'return', 'exit', 'export', 'local', 'echo', 'cd', 'pwd', 'source', 'readonly', 'shift'
  ],
  dockerfile: ['FROM', 'RUN', 'CMD', 'LABEL', 'EXPOSE', 'ENV', 'ADD', 'COPY', 'ENTRYPOINT', 'VOLUME', 'WORKDIR', 'ARG', 'USER', 'STOPSIGNAL', 'HEALTHCHECK', 'SHELL'],
  markdown: [],
  json: ['true', 'false', 'null'],
  plaintext: []
};

export const LANGUAGE_BUILTINS: Record<string, string[]> = {
  typescript: ['console', 'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Map', 'Set', 'JSON', 'Math', 'Date', 'Error', 'parseInt', 'parseFloat'],
  javascript: ['console', 'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Map', 'Set', 'JSON', 'Math', 'Date', 'Error', 'parseInt', 'parseFloat', 'window', 'document'],
  java: ['String', 'Integer', 'Long', 'Double', 'Boolean', 'List', 'Map', 'Set', 'Optional', 'System', 'Math', 'Objects', 'Arrays', 'Stream', 'Collectors'],
  python: ['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'bool', 'type', 'isinstance', 'enumerate', 'zip', 'open'],
  go: ['fmt', 'len', 'make', 'append', 'cap', 'copy', 'delete', 'panic', 'recover', 'print', 'println'],
  rust: ['println!', 'vec!', 'format!', 'String', 'Vec', 'Option', 'Result', 'Some', 'None', 'Ok', 'Err'],
  csharp: ['Console', 'String', 'Int32', 'List', 'Dictionary', 'Task', 'Math', 'Convert', 'Enumerable'],
  sql: ['NOW', 'CURRENT_TIMESTAMP', 'COALESCE', 'NULLIF', 'CAST', 'CONCAT'],
  html: [],
  css: [],
  php: ['echo', 'print', 'array', 'count', 'strlen', 'isset', 'empty', 'json_encode', 'json_decode'],
  ruby: ['puts', 'print', 'Array', 'Hash', 'String', 'Integer', 'require', 'include'],
  kotlin: ['println', 'print', 'listOf', 'mapOf', 'setOf', 'arrayOf', 'lazy', 'sequenceOf'],
  swift: ['print', 'Array', 'Dictionary', 'Set', 'String', 'Int', 'Double', 'Bool'],
  cpp: ['std', 'cout', 'cin', 'endl', 'vector', 'string', 'map', 'unique_ptr', 'shared_ptr'],
  shell: ['echo', 'exit', 'export', 'source', 'printf', 'read', 'test', 'grep', 'awk', 'sed'],
  dockerfile: [],
  scss: [],
  yaml: [],
  xml: [],
  markdown: [],
  json: [],
  plaintext: []
};

export interface ExtractedSymbol {
  name: string;
  kind: Monaco.languages.CompletionItemKind;
  detail?: string;
}

const SYMBOL_PATTERNS: Array<{ regex: RegExp; kind: Monaco.languages.CompletionItemKind; detail: string }> = [
  { regex: /(?:function|func|fn)\s+([A-Za-z_]\w*)/g, kind: 1 /* Function */, detail: 'function' },
  { regex: /\bdef\s+([A-Za-z_]\w*)/g, kind: 1, detail: 'function' },
  { regex: /\bfun\s+([A-Za-z_]\w*)/g, kind: 1, detail: 'function' },
  { regex: /(?:public|private|protected|static|async|virtual|override|abstract|\s)*\s*(?:void|int|String|boolean|bool|float|double|long|char|byte|short|var|val|auto|[\w.<>,\[\]]+)\s+([A-Za-z_]\w*)\s*\(/g, kind: 1, detail: 'method' },
  { regex: /(?:class|interface|struct|enum|record|trait|type)\s+([A-Za-z_]\w*)/g, kind: 7 /* Class */, detail: 'type' },
  { regex: /(?:const|let|var|final|readonly|mut|val)\s+(?:[\w.<>,\[\]]+\s+)?([A-Za-z_]\w*)\s*[=:]/g, kind: 6 /* Variable */, detail: 'variable' },
  { regex: /(?:import|using|namespace|package)\s+([\w.]+)/g, kind: 9 /* Module */, detail: 'import' },
  { regex: /@([A-Za-z_]\w*)/g, kind: 14 /* Keyword as annotation */, detail: 'annotation' }
];

export function extractDocumentSymbols(text: string): ExtractedSymbol[] {
  const found = new Map<string, ExtractedSymbol>();

  for (const { regex, kind, detail } of SYMBOL_PATTERNS) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const name = match[1];
      if (!name || name.length < 2) continue;
      if (!found.has(name)) {
        found.set(name, { name, kind, detail });
      }
    }
  }

  return [...found.values()];
}

export function getEditorSuggestOptions(): Monaco.editor.IStandaloneEditorConstructionOptions {
  return {
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true
    },
    suggestOnTriggerCharacters: true,
    wordBasedSuggestions: 'currentDocument',
    tabCompletion: 'on',
    acceptSuggestionOnCommitCharacter: true,
    snippetSuggestions: 'inline',
    parameterHints: { enabled: true },
    suggest: {
      preview: true,
      showKeywords: true,
      showSnippets: true,
      showWords: true,
      showMethods: true,
      showFunctions: true,
      showVariables: true,
      showClasses: true,
      showModules: true,
      snippetsPreventQuickSuggestions: false,
      localityBonus: true,
      filterGraceful: true
    }
  };
}
