export interface AdminDashboard {
  totalUsers: number;
  totalChats: number;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  activeUsersToday: number;
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
