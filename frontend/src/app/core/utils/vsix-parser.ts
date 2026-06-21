import { OpenVsxSearchItem, ParsedVsixPackage, IdeExtensionSnippet } from '../models/ide-extension';

const OPEN_VSX_API = 'https://open-vsx.org/api';
export const MAX_VSIX_BYTES = 8 * 1024 * 1024;

export interface OpenVsxExtensionMeta {
  namespace: string;
  name: string;
  version: string;
  displayName: string;
  description: string;
  publisher: string;
  downloadUrl: string;
  manifestUrl?: string;
  iconUrl?: string;
  downloadCount: number;
  verified: boolean;
}

interface VsCodeSnippetBody {
  prefix?: string | string[];
  body: string | string[];
  description?: string;
}

interface VsCodePackageJson {
  name?: string;
  displayName?: string;
  publisher?: string;
  version?: string;
  description?: string;
  contributes?: {
    grammars?: Array<{ language?: string; scopeName?: string }>;
    languages?: Array<{ id: string }>;
    snippets?: Array<{ language: string; path: string }> | Record<string, unknown>;
  };
}

export function parseVsCodeSnippets(raw: Record<string, VsCodeSnippetBody>): IdeExtensionSnippet[] {
  return Object.entries(raw).map(([key, snippet]) => {
    const prefix = snippet.prefix;
    const label = Array.isArray(prefix) ? prefix[0] : prefix ?? key;
    const body = Array.isArray(snippet.body) ? snippet.body.join('\n') : snippet.body;
    return {
      label,
      insertText: body,
      detail: snippet.description ?? key
    };
  });
}

export function extractLanguageIds(pkg: VsCodePackageJson): string[] {
  const ids = new Set<string>();
  for (const grammar of pkg.contributes?.grammars ?? []) {
    if (grammar.language) ids.add(grammar.language);
  }
  for (const language of pkg.contributes?.languages ?? []) {
    if (language.id) ids.add(language.id);
  }
  const snippets = pkg.contributes?.snippets;
  if (Array.isArray(snippets)) {
    for (const item of snippets) {
      if (item.language) ids.add(item.language);
    }
  }
  return [...ids];
}

export async function parseVsixBuffer(buffer: ArrayBuffer): Promise<ParsedVsixPackage> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);

  const packageEntry = zip.file('extension/package.json');
  if (!packageEntry) {
    throw new Error('VSIX không có package.json');
  }

  const pkg = JSON.parse(await packageEntry.async('string')) as VsCodePackageJson;
  const snippets: IdeExtensionSnippet[] = [];

  const snippetContrib = pkg.contributes?.snippets;
  if (Array.isArray(snippetContrib)) {
    for (const item of snippetContrib) {
      const path = item.path.replace(/^\.\//, '');
      const filePath = `extension/${path}`;
      const file = zip.file(filePath);
      if (!file) continue;
      const raw = JSON.parse(await file.async('string')) as Record<string, VsCodeSnippetBody>;
      snippets.push(...parseVsCodeSnippets(raw));
    }
  }

  return {
    displayName: pkg.displayName ?? pkg.name ?? 'Extension',
    publisher: pkg.publisher ?? 'unknown',
    version: pkg.version ?? '0.0.0',
    description: pkg.description ?? '',
    languageIds: extractLanguageIds(pkg),
    snippets
  };
}

export function parsePackageJsonManifest(text: string): ParsedVsixPackage {
  const pkg = JSON.parse(text) as VsCodePackageJson;
  return {
    displayName: pkg.displayName ?? pkg.name ?? 'Extension',
    publisher: pkg.publisher ?? 'unknown',
    version: pkg.version ?? '0.0.0',
    description: pkg.description ?? '',
    languageIds: extractLanguageIds(pkg),
    snippets: []
  };
}

export function toSearchItem(meta: OpenVsxExtensionMeta, manifest?: ParsedVsixPackage): OpenVsxSearchItem {
  return {
    id: `vsx:${meta.namespace}.${meta.name}`,
    namespace: meta.namespace,
    name: meta.name,
    version: meta.version,
    displayName: manifest?.displayName ?? meta.displayName,
    description: manifest?.description ?? meta.description,
    publisher: manifest?.publisher ?? meta.publisher,
    downloadUrl: meta.downloadUrl,
    manifestUrl: meta.manifestUrl,
    iconUrl: meta.iconUrl,
    downloadCount: meta.downloadCount,
    verified: meta.verified,
    languageIds: manifest?.languageIds ?? []
  };
}

export function openVsxLatestUrl(namespace: string, name: string): string {
  return `${OPEN_VSX_API}/${namespace}/${name}/latest`;
}

export function openVsxSearchUrl(query: string, size = 20): string {
  const params = new URLSearchParams({ query, size: String(size) });
  return `${OPEN_VSX_API}/-/search?${params}`;
}

export function mapApiExtension(raw: Record<string, unknown>): OpenVsxExtensionMeta | null {
  const namespace = String(raw['namespace'] ?? '');
  const name = String(raw['name'] ?? '');
  const files = raw['files'] as Record<string, string> | undefined;
  const downloadUrl = files?.['download'];
  if (!namespace || !name || !downloadUrl) return null;

  return {
    namespace,
    name,
    version: String(raw['version'] ?? ''),
    displayName: String(raw['displayName'] ?? name),
    description: String(raw['description'] ?? ''),
    publisher: namespace,
    downloadUrl,
    manifestUrl: files?.['manifest'],
    iconUrl: files?.['icon'],
    downloadCount: Number(raw['downloadCount'] ?? 0),
    verified: Boolean(raw['verified'])
  };
}
