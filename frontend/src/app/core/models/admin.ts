export interface AdminDashboard {
  totalUsers: number;
  totalChats: number;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  activeUsersToday: number;
  pluginInstallations: number;
  pluginActiveSessions: number;
  pluginRequests: number;
  pluginTokens: number;
}

export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface AdminUser {
  id: number;
  email: string;
  fullName: string;
  status: UserStatus;
  totalRequests: number;
  totalTokens: number;
  createdAt: string;
}

export interface AdminUsage {
  id: number;
  userId: number;
  userEmail: string;
  conversationId?: number;
  model: string;
  prompt?: string;
  response?: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  createdAt: string;
}

export interface AdminConversation {
  id: number;
  userId: number;
  userEmail: string;
  title: string;
  question: string;
  answer: string;
  model: string;
  tokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModelStatistic {
  model: string;
  requests: number;
}

export interface SeriesPoint {
  label: string;
  value: number;
}

export interface LabelValue {
  label: string;
  value: number;
}

export interface DecimalSeriesPoint {
  label: string;
  value: number;
}

export interface TokenAnalytics {
  tokensPerDay: SeriesPoint[];
  tokensPerModel: LabelValue[];
  tokensPerUser: LabelValue[];
}

export interface CostAnalytics {
  today: number;
  month: number;
  year: number;
  costPerDay: DecimalSeriesPoint[];
}

export interface UsageFilters {
  model?: string;
  userId?: number;
  from?: string;
  to?: string;
}

export interface AdminPluginDashboard {
  totalInstallations: number;
  activeSessions: number;
  totalRequests: number;
  totalTokens: number;
  requestsByEditor: LabelValue[];
  requestsByEndpoint: LabelValue[];
  requestsPerDay: SeriesPoint[];
}

export interface AdminPluginUsage {
  id: number;
  userId: number;
  userEmail: string;
  editorType: string;
  endpoint: string;
  modelName?: string;
  tokens: number;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  createdAt: string;
}

export interface AdminPluginSession {
  id: number;
  userId: number;
  userEmail: string;
  editorType: string;
  projectName?: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface AdminPluginInstallation {
  id: number;
  userId: number;
  userEmail: string;
  editorType: string;
  version?: string;
  installedAt: string;
}

export interface PluginUsageFilters {
  editorType?: string;
  userId?: number;
  endpoint?: string;
  from?: string;
  to?: string;
}
