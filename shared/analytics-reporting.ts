/** Read-only reporting contract. Collection continues to use shared/analytics.ts. */
export const reportPresets = ["today", "24h", "7d", "30d", "90d", "12m", "custom"] as const;
export type ReportPreset = typeof reportPresets[number];
export type ReportInterval = "hour" | "day" | "week" | "month";
export type Coverage = "complete" | "partial" | "unavailable" | "future";
export type ReportPlatform = "ios" | "android" | "web";
export interface ReportFilters {
  preset: ReportPreset;
  startDate?: string;
  endDate?: string;
  interval?: ReportInterval;
}
export interface ReportContext extends ReportFilters {
  timezone: "Asia/Dubai";
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
  asOf: string;
  interval: ReportInterval;
  comparisonLabel: string;
  partialPeriod: boolean;
}
export interface ReportMetrics {
  appOpens: number;
  sessions: number;
  visitors: number;
  signedInUsers: number;
  newVisitors: number;
  returningVisitors: number;
  screenViews: number;
  sessionsPerVisitor: number;
  avgSessionSeconds: number | null;
  completedSessions: number;
  dau: number;
  wau: number;
  mau: number;
  stickiness: number;
}
export interface ReportRevenue {
  total: number;
  automotive: number;
  spareParts: number;
  other: number;
  purchases: number;
  payingUsers: number;
  averageValue: number;
}
export interface PlatformCounts { appOpens: number; sessions: number; visitors: number }
export interface ReportPoint {
  time: string;
  end: string;
  actualStart: string;
  actualEnd: string;
  partial: boolean;
  coverage: Coverage;
  rollingCoverage: Coverage;
  appOpens: number | null;
  sessions: number | null;
  visitors: number | null;
  signedInUsers: number | null;
  newVisitors: number | null;
  returningVisitors: number | null;
  screenViews: number | null;
  dau: number | null;
  wau: number | null;
  mau: number | null;
  revenue: number | null;
  automotiveRevenue: number | null;
  sparePartsRevenue: number | null;
  otherRevenue: number | null;
  platforms: Record<ReportPlatform, { appOpens: number | null; sessions: number | null; visitors: number | null }>;
}
export interface ScreenRow { screen: string; views: number; visitors: number; share: number }
export interface VersionRow {
  platform: "ios" | "android";
  version: string | null;
  build: string | null;
  visitors: number;
  share: number;
}
export interface AnalyticsReport {
  context: ReportContext;
  coverage: {
    collectionStartedAt: string | null;
    current: Coverage;
    previous: Coverage;
    currentRolling: Coverage;
    previousRolling: Coverage;
    currentDau: Coverage;
    previousDau: Coverage;
    currentWau: Coverage;
    previousWau: Coverage;
    basis: string;
  };
  current: ReportMetrics;
  previous: ReportMetrics;
  revenue: { current: ReportRevenue; previous: ReportRevenue };
  series: { current: ReportPoint[]; previous: ReportPoint[] };
  platforms: Array<PlatformCounts & { platform: ReportPlatform; appOpenShare: number; sessionShare: number; visitorShare: number }>;
  versions: VersionRow[];
  versionTotal: number;
  versionsTruncated: boolean;
  screens: ScreenRow[];
  screenCount: number;
  screensTruncated: boolean;
  duration: Array<{ label: string; sessions: number }>;
}
export interface ScreenReport {
  context: ReportContext;
  screen: string;
  current: ScreenReportPoint[];
  previous: ScreenReportPoint[];
}
export interface ScreenReportPoint {
  time: string;
  end: string;
  actualStart: string;
  actualEnd: string;
  partial: boolean;
  views: number | null;
  coverage: Coverage;
}
export const VISITOR_EXPLANATION = "Unique browser/device analytics identities. One person using multiple devices may count more than once.";
export function percentChange(current: number, previous: number): number | null {
  return previous <= 0 ? null : (current - previous) / previous * 100;
}
