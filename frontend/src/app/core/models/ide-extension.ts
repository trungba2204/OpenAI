export interface IdeExtensionSnippet {
  label: string;
  insertText: string;
  detail?: string;
}

export interface OpenVsxRef {
  namespace: string;
  name: string;
}

export interface IdeExtensionInfo {
  id: string;
  name: string;
  publisher: string;
  description: string;
  languageId: string;
  icon: string;
  fileExtensions: string[];
  downloadSizeKb: number;
  tags: string[];
  snippets: IdeExtensionSnippet[];
  openVsx?: OpenVsxRef;
  iconUrl?: string;
  version?: string;
  source?: 'builtin' | 'openvsx';
}

export interface OpenVsxSearchItem {
  id: string;
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
  languageIds: string[];
}

export interface ParsedVsixPackage {
  displayName: string;
  publisher: string;
  version: string;
  description: string;
  languageIds: string[];
  snippets: IdeExtensionSnippet[];
}

export type InstallPhase = 'downloading' | 'installing' | 'done' | 'error';

export interface InstallProgress {
  extensionId: string;
  phase: InstallPhase;
  percent: number;
  message?: string;
  error?: string;
}
