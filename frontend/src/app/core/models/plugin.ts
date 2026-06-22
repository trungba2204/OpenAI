export interface PluginDeviceCode {
  code: string;
  expiresAt: string;
}

export interface PluginSession {
  id: number;
  editorType: string;
  projectName?: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface PluginUsageSummary {
  totalRequests: number;
  totalTokens: number;
}
