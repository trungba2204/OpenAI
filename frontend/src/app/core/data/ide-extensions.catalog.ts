import { IdeExtensionInfo } from '../models/ide-extension';

const DEFAULT_INSTALLED = [
  'typescript',
  'javascript',
  'html',
  'css',
  'json',
  'markdown'
];

export { DEFAULT_INSTALLED };

export const IDE_EXTENSION_CATALOG: IdeExtensionInfo[] = [
  {
    id: 'typescript',
    name: 'TypeScript Language',
    publisher: 'AI Platform',
    description: 'Syntax highlighting, bracket matching và snippets cho TypeScript.',
    languageId: 'typescript',
    icon: '🔷',
    fileExtensions: ['ts', 'mts', 'cts'],
    downloadSizeKb: 420,
    tags: ['typescript', 'javascript', 'web'],
    snippets: [
      { label: 'interface', insertText: 'interface ${1:Name} {\n\t$0\n}', detail: 'Interface' },
      { label: 'type', insertText: 'type ${1:Name} = ${0:unknown};', detail: 'Type alias' }
    ]
  },
  {
    id: 'javascript',
    name: 'JavaScript Language',
    publisher: 'AI Platform',
    description: 'Hỗ trợ JavaScript/JSX với highlight và snippets cơ bản.',
    languageId: 'javascript',
    icon: '🟨',
    fileExtensions: ['js', 'mjs', 'cjs', 'jsx'],
    downloadSizeKb: 380,
    tags: ['javascript', 'web', 'node'],
    snippets: [
      { label: 'fn', insertText: 'function ${1:name}($2) {\n\t$0\n}', detail: 'Function' },
      { label: 'afn', insertText: 'const ${1:name} = ($2) => {\n\t$0\n};', detail: 'Arrow function' }
    ]
  },
  {
    id: 'java',
    name: 'Java Language',
    publisher: 'AI Platform',
    description: 'Highlight Java, Spring annotations và snippets class/method.',
    languageId: 'java',
    icon: '☕',
    fileExtensions: ['java'],
    downloadSizeKb: 510,
    tags: ['java', 'spring', 'backend'],
    snippets: [
      { label: 'class', insertText: 'public class ${1:Name} {\n\t$0\n}', detail: 'Class' },
      { label: 'main', insertText: 'public static void main(String[] args) {\n\t$0\n}', detail: 'Main method' }
    ]
  },
  {
    id: 'python',
    name: 'Python Language',
    publisher: 'AI Platform',
    description: 'Python syntax, indentation và snippets def/class.',
    languageId: 'python',
    icon: '🐍',
    fileExtensions: ['py', 'pyw', 'pyi'],
    downloadSizeKb: 460,
    tags: ['python', 'data', 'backend'],
    snippets: [
      { label: 'def', insertText: 'def ${1:name}($2):\n\t$0', detail: 'Function' },
      { label: 'class', insertText: 'class ${1:Name}:\n\t$0', detail: 'Class' }
    ]
  },
  {
    id: 'html',
    name: 'HTML Language',
    publisher: 'AI Platform',
    description: 'HTML tags, attributes và Emmet-style snippets.',
    languageId: 'html',
    icon: '🌐',
    fileExtensions: ['html', 'htm'],
    downloadSizeKb: 290,
    tags: ['html', 'web', 'frontend'],
    snippets: [
      { label: 'html5', insertText: '<!DOCTYPE html>\n<html lang="vi">\n<head>\n\t<meta charset="UTF-8" />\n\t<title>${1:Title}</title>\n</head>\n<body>\n\t$0\n</body>\n</html>', detail: 'HTML5 boilerplate' }
    ]
  },
  {
    id: 'css',
    name: 'CSS Language',
    publisher: 'AI Platform',
    description: 'CSS properties, selectors và SCSS companion.',
    languageId: 'css',
    icon: '🎨',
    fileExtensions: ['css'],
    downloadSizeKb: 240,
    tags: ['css', 'web', 'frontend'],
    snippets: [
      { label: 'flex', insertText: 'display: flex;\njustify-content: ${1:center};\nalign-items: ${2:center};', detail: 'Flexbox' }
    ]
  },
  {
    id: 'scss',
    name: 'SCSS Language',
    publisher: 'AI Platform',
    description: 'SCSS/Sass nesting, variables và mixins.',
    languageId: 'scss',
    icon: '💅',
    fileExtensions: ['scss', 'sass'],
    downloadSizeKb: 310,
    tags: ['scss', 'css', 'frontend'],
    snippets: [
      { label: 'mixin', insertText: '@mixin ${1:name}($2) {\n\t$0\n}', detail: 'Mixin' }
    ]
  },
  {
    id: 'json',
    name: 'JSON Language',
    publisher: 'AI Platform',
    description: 'JSON validation và syntax highlighting.',
    languageId: 'json',
    icon: '📋',
    fileExtensions: ['json'],
    downloadSizeKb: 120,
    tags: ['json', 'config'],
    snippets: []
  },
  {
    id: 'markdown',
    name: 'Markdown Language',
    publisher: 'AI Platform',
    description: 'Markdown preview support và heading snippets.',
    languageId: 'markdown',
    icon: '📝',
    fileExtensions: ['md', 'markdown'],
    downloadSizeKb: 180,
    tags: ['markdown', 'docs'],
    snippets: [
      { label: 'h1', insertText: '# ${1:Heading}', detail: 'Heading 1' },
      { label: 'code', insertText: '```${1:lang}\n$0\n```', detail: 'Code block' }
    ]
  },
  {
    id: 'go',
    name: 'Go Language',
    publisher: 'AI Platform',
    description: 'Go syntax, package main và error handling snippets.',
    languageId: 'go',
    icon: '🐹',
    fileExtensions: ['go'],
    downloadSizeKb: 390,
    tags: ['go', 'backend'],
    snippets: [
      { label: 'main', insertText: 'package main\n\nimport "fmt"\n\nfunc main() {\n\t$0\n}', detail: 'Main package' }
    ]
  },
  {
    id: 'rust',
    name: 'Rust Language',
    publisher: 'AI Platform',
    description: 'Rust ownership patterns, fn main và struct snippets.',
    languageId: 'rust',
    icon: '🦀',
    fileExtensions: ['rs'],
    downloadSizeKb: 480,
    tags: ['rust', 'systems'],
    snippets: [
      { label: 'main', insertText: 'fn main() {\n\t$0\n}', detail: 'Main function' },
      { label: 'struct', insertText: 'struct ${1:Name} {\n\t$0\n}', detail: 'Struct' }
    ]
  },
  {
    id: 'csharp',
    name: 'C# Language',
    publisher: 'AI Platform',
    description: 'C# classes, async/await và .NET snippets.',
    languageId: 'csharp',
    icon: '🔷',
    fileExtensions: ['cs'],
    downloadSizeKb: 450,
    tags: ['csharp', 'dotnet', 'backend'],
    snippets: [
      { label: 'class', insertText: 'public class ${1:Name}\n{\n\t$0\n}', detail: 'Class' }
    ]
  },
  {
    id: 'cpp',
    name: 'C/C++ Language',
    publisher: 'AI Platform',
    description: 'C và C++ syntax highlighting, include snippets.',
    languageId: 'cpp',
    icon: '⚙️',
    fileExtensions: ['c', 'h', 'cpp', 'hpp', 'cc'],
    downloadSizeKb: 520,
    tags: ['c', 'cpp', 'systems'],
    snippets: [
      { label: 'include', insertText: '#include <${1:stdio.h}>', detail: 'Include' }
    ]
  },
  {
    id: 'php',
    name: 'PHP Language',
    publisher: 'AI Platform',
    description: 'PHP tags, classes và Laravel-friendly snippets.',
    languageId: 'php',
    icon: '🐘',
    fileExtensions: ['php'],
    downloadSizeKb: 370,
    tags: ['php', 'web', 'backend'],
    snippets: [
      { label: 'class', insertText: 'class ${1:Name} {\n\t$0\n}', detail: 'Class' }
    ]
  },
  {
    id: 'ruby',
    name: 'Ruby Language',
    publisher: 'AI Platform',
    description: 'Ruby methods, classes và Rails snippets.',
    languageId: 'ruby',
    icon: '💎',
    fileExtensions: ['rb'],
    downloadSizeKb: 340,
    tags: ['ruby', 'rails'],
    snippets: [
      { label: 'def', insertText: 'def ${1:name}\n\t$0\nend', detail: 'Method' }
    ]
  },
  {
    id: 'kotlin',
    name: 'Kotlin Language',
    publisher: 'AI Platform',
    description: 'Kotlin Android/backend syntax và data class snippets.',
    languageId: 'kotlin',
    icon: '🟣',
    fileExtensions: ['kt', 'kts'],
    downloadSizeKb: 410,
    tags: ['kotlin', 'android'],
    snippets: [
      { label: 'fun', insertText: 'fun ${1:name}($2) {\n\t$0\n}', detail: 'Function' }
    ]
  },
  {
    id: 'swift',
    name: 'Swift Language',
    publisher: 'AI Platform',
    description: 'Swift iOS/macOS syntax và struct snippets.',
    languageId: 'swift',
    icon: '🍎',
    fileExtensions: ['swift'],
    downloadSizeKb: 400,
    tags: ['swift', 'ios'],
    snippets: [
      { label: 'struct', insertText: 'struct ${1:Name} {\n\t$0\n}', detail: 'Struct' }
    ]
  },
  {
    id: 'sql',
    name: 'SQL Language',
    publisher: 'AI Platform',
    description: 'SQL queries, DDL/DML và MySQL/PostgreSQL dialects.',
    languageId: 'sql',
    icon: '🗄️',
    fileExtensions: ['sql'],
    downloadSizeKb: 280,
    tags: ['sql', 'database'],
    snippets: [
      { label: 'select', insertText: 'SELECT ${1:columns}\nFROM ${2:table}\nWHERE ${3:condition};', detail: 'SELECT' }
    ]
  },
  {
    id: 'yaml',
    name: 'YAML Language',
    publisher: 'AI Platform',
    description: 'YAML config files, Docker Compose và CI snippets.',
    languageId: 'yaml',
    icon: '📄',
    fileExtensions: ['yml', 'yaml'],
    downloadSizeKb: 190,
    tags: ['yaml', 'config', 'devops'],
    snippets: []
  },
  {
    id: 'xml',
    name: 'XML Language',
    publisher: 'AI Platform',
    description: 'XML/HTML-like configs, Maven pom và Spring XML.',
    languageId: 'xml',
    icon: '📰',
    fileExtensions: ['xml', 'xsd', 'xsl'],
    downloadSizeKb: 220,
    tags: ['xml', 'config'],
    snippets: []
  },
  {
    id: 'shell',
    name: 'Shell Script',
    publisher: 'AI Platform',
    description: 'Bash/Zsh scripts, shebang và chmod snippets.',
    languageId: 'shell',
    icon: '🐚',
    fileExtensions: ['sh', 'bash', 'zsh'],
    downloadSizeKb: 260,
    tags: ['shell', 'bash', 'devops'],
    snippets: [
      { label: 'shebang', insertText: '#!/usr/bin/env bash\n\n$0', detail: 'Shebang' }
    ]
  },
  {
    id: 'docker',
    name: 'Docker',
    publisher: 'AI Platform',
    description: 'Dockerfile syntax và multi-stage build snippets.',
    languageId: 'dockerfile',
    icon: '🐳',
    fileExtensions: ['dockerfile'],
    downloadSizeKb: 210,
    tags: ['docker', 'devops'],
    snippets: [
      { label: 'from', insertText: 'FROM ${1:node:20-alpine}\nWORKDIR /app\nCOPY . .\nRUN ${2:npm install}\nCMD ["${3:npm}", "start"]', detail: 'Dockerfile boilerplate' }
    ]
  },
  {
    id: 'vue',
    name: 'Vue Language',
    publisher: 'AI Platform',
    description: 'Vue SFC template, script setup snippets.',
    languageId: 'html',
    icon: '💚',
    fileExtensions: ['vue'],
    downloadSizeKb: 350,
    tags: ['vue', 'frontend'],
    snippets: [
      { label: 'setup', insertText: '<script setup lang="ts">\n$0\n</script>\n\n<template>\n\t<div></div>\n</template>', detail: 'Vue SFC setup' }
    ]
  }
];

export const OPEN_VSX_MAP: Record<string, { namespace: string; name: string }> = {
  typescript: { namespace: 'TypeScriptTeam', name: 'typescript' },
  javascript: { namespace: 'TypeScriptTeam', name: 'javascript' },
  java: { namespace: 'redhat', name: 'java' },
  python: { namespace: 'ms-python', name: 'python' },
  html: { namespace: 'html', name: 'html' },
  css: { namespace: 'vscode', name: 'css' },
  scss: { namespace: 'vscode', name: 'scss' },
  json: { namespace: 'vscode', name: 'json' },
  markdown: { namespace: 'vscode', name: 'markdown' },
  go: { namespace: 'golang', name: 'go' },
  rust: { namespace: 'rust-lang', name: 'rust' },
  csharp: { namespace: 'ms-dotnettools', name: 'csharp' },
  cpp: { namespace: 'ms-vscode', name: 'cpp' },
  php: { namespace: 'bmewburn', name: 'intelephense-client' },
  ruby: { namespace: 'rebornix', name: 'Ruby' },
  kotlin: { namespace: 'fwcd', name: 'kotlin' },
  swift: { namespace: 'sswg', name: 'swift-lang' },
  sql: { namespace: 'mtxr', name: 'sqltools' },
  yaml: { namespace: 'redhat', name: 'vscode-yaml' },
  xml: { namespace: 'redhat', name: 'vscode-xml' },
  shell: { namespace: 'timonwong', name: 'shellcheck' },
  docker: { namespace: 'ms-azuretools', name: 'vscode-docker' },
  vue: { namespace: 'vue', name: 'volar' }
};

for (const ext of IDE_EXTENSION_CATALOG) {
  const ref = OPEN_VSX_MAP[ext.id];
  if (ref) ext.openVsx = ref;
}

export const EXTENSION_BY_ID = new Map(IDE_EXTENSION_CATALOG.map(e => [e.id, e]));

export const EXTENSION_BY_LANGUAGE = new Map(IDE_EXTENSION_CATALOG.map(e => [e.languageId, e]));

export const EXTENSION_BY_EXTENSION: Record<string, string> = IDE_EXTENSION_CATALOG.reduce((acc, ext) => {
  for (const suffix of ext.fileExtensions) {
    acc[suffix] = ext.id;
  }
  return acc;
}, {} as Record<string, string>);
