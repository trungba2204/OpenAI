export interface PluginDeviceCode {
  code: string;
  expiresAt: string;
}

export type PluginDeviceCodeStatus = 'PENDING' | 'CONNECTED' | 'EXPIRED';

export interface PluginDeviceCodeStatusResponse {
  status: PluginDeviceCodeStatus;
}

export interface PluginConnectionStatus {
  connected: boolean;
  editorType?: string;
  projectName?: string;
  lastSeenAt?: string;
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
