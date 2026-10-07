import { sql } from "drizzle-orm";
import { pgTable, uuid, timestamp, varchar, text, jsonb, index, uniqueIndex, primaryKey, date, boolean, check } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const analyticsVisitors = pgTable("analytics_visitors", {
  anonymousId: uuid("anonymous_id").primaryKey(),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
});
export const analyticsSessions = pgTable("analytics_sessions", {
  sessionId: uuid("session_id").primaryKey(),
  anonymousId: uuid("anonymous_id").notNull().references(() => analyticsVisitors.anonymousId, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  multipleUsers: boolean("multiple_users").notNull().default(false),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull(),
  platform: text("platform").notNull(),
  appVersion: text("app_version"),
  appBuild: text("app_build"),
}, t => [
  index("analytics_sessions_started_idx").on(t.startedAt),
  index("analytics_sessions_visitor_idx").on(t.anonymousId, t.startedAt),
  check("analytics_sessions_platform_check", sql`${t.platform} in ('ios', 'android', 'web')`),
]);
export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey(),
  eventName: text("event_name").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  anonymousId: uuid("anonymous_id").notNull().references(() => analyticsVisitors.anonymousId, { onDelete: "cascade" }),
  sessionId: uuid("session_id").notNull().references(() => analyticsSessions.sessionId, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  appVersion: text("app_version"),
  appBuild: text("app_build"),
  screen: text("screen"),
  properties: jsonb("properties").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [
  index("analytics_events_name_time_idx").on(t.eventName, t.timestamp),
  index("analytics_events_visitor_time_idx").on(t.anonymousId, t.timestamp),
  index("analytics_events_user_time_idx").on(t.userId, t.timestamp),
  index("analytics_events_session_idx").on(t.sessionId),
  index("analytics_events_platform_time_idx").on(t.platform, t.timestamp),
  index("analytics_events_time_idx").on(t.timestamp),
  uniqueIndex("analytics_one_session_start_idx").on(t.sessionId).where(sql`${t.eventName} = 'session_start'`),
  check("analytics_events_name_check", sql`${t.eventName} in ('app_open', 'session_start', 'screen_view')`),
  check("analytics_events_platform_check", sql`${t.platform} in ('ios', 'android', 'web')`),
]);
export const analyticsDailyVisits = pgTable("analytics_daily_visits", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  day: date("day").notNull(),
}, t => [primaryKey({ columns: [t.userId, t.platform, t.day] })]);
