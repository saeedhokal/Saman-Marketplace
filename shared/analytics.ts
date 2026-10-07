import { z } from "zod";

export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const ANALYTICS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const REPORTING_TIMEZONE = "Asia/Dubai";
export const analyticsScreens = [
  "home", "search", "listing_details", "post_listing", "profile", "seller",
  "favourites", "login", "register", "packages", "credits", "checkout", "other",
] as const;
export type AnalyticsScreen = typeof analyticsScreens[number];
export type AnalyticsPlatform = "ios" | "android" | "web";

export function dubaiDay(date = new Date()): string {
  // Dubai is UTC+04:00 year round (no DST).
  return new Date(date.getTime() + 4 * 3600000).toISOString().slice(0, 10);
}
export function statsRange(period: string, now = new Date()) {
  const start = period === "today"
    ? new Date(`${dubaiDay(now)}T00:00:00+04:00`)
    : new Date(now.getTime() - ({ last24hours: 1, week: 7, month: 30, year: 365 }[period] ?? 7) * 86400000);
  return { start, end: now };
}

// Only known path shapes are retained. Never persist query strings, hashes,
// arbitrary auth/reset URLs, free text, contact details or payment tokens.
export function screenForPath(raw: string): { screen: AnalyticsScreen; pathname: string } | null {
  const path = raw.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const fixed: Record<string, AnalyticsScreen> = {
    "/": "home", "/categories": "search", "/sell": "post_listing",
    "/profile": "profile", "/profile/details": "profile", "/favorites": "favourites",
    "/profile/subscription": "packages", "/profile/credits": "credits",
  };
  if (fixed[path]) return { screen: fixed[path], pathname: path };
  if (/^\/product\/[^/]+$/.test(path)) return { screen: "listing_details", pathname: "/product/:slug" };
  if (/^\/seller\/[^/]+$/.test(path)) return { screen: "seller", pathname: "/seller/:sellerId" };
  if (/^\/checkout\/[^/]+$/.test(path)) return { screen: "checkout", pathname: "/checkout/:id" };
  // Auth owns its login/register mode; redirects are deliberately ignored.
  return null;
}

const safePaths = ["/", "/categories", "/sell", "/profile", "/profile/details",
  "/favorites", "/profile/subscription", "/profile/credits", "/auth",
  "/product/:slug", "/seller/:sellerId", "/checkout/:id"] as const;
export const analyticsContextSchema = z.object({
  anonymousId: z.string().uuid(),
  sessionId: z.string().uuid(),
  sessionStartedAt: z.string().datetime(),
  timestamp: z.string().datetime(),
  userId: z.string().min(1).max(128).nullable(),
  platform: z.enum(["ios", "android", "web"]),
  appVersion: z.string().max(64).nullable(),
  appBuild: z.string().max(64).nullable(),
});
export const analyticsEventSchema = analyticsContextSchema.extend({
  id: z.string().uuid(),
  eventName: z.enum(["app_open", "screen_view"]),
  screen: z.enum(analyticsScreens).nullable(),
  properties: z.object({ pathname: z.enum(safePaths).optional() }).strict(),
}).strict();
export const analyticsActivitySchema = analyticsContextSchema.strict();
export type AnalyticsEventInput = z.infer<typeof analyticsEventSchema>;
export type AnalyticsContext = z.infer<typeof analyticsContextSchema>;

export interface AnalyticsSummary {
  timezone: string;
  start: string;
  end: string;
  appOpens: number;
  sessions: number;
  uniqueVisitors: number;
  uniqueSignedInUsers: number;
  newAnonymousVisitors: number;
  returningAnonymousVisitors: number;
  platforms: Record<AnalyticsPlatform, number>;
  recentEvents: Array<{
    id: string; eventName: string; timestamp: string; anonymousId: string;
    sessionId: string; userId: string | null; platform: string;
    appVersion: string | null; appBuild: string | null; screen: string | null;
  }>;
}
