import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { analyticsVisitors as visitors, analyticsSessions as sessions, analyticsEvents as events, analyticsDailyVisits as visits, loginEvents, users } from "../../shared/schema";
import { ANALYTICS_MAX_AGE_MS, dubaiDay, statsRange, REPORTING_TIMEZONE, type AnalyticsContext, type AnalyticsEventInput, type AnalyticsSummary } from "../../shared/analytics";

export class AnalyticsInputError extends Error {}

// Injecting the database makes concurrency/restart tests use the very same code.
export function createAnalyticsStore(database = db) {
  async function collect(input: AnalyticsContext, verifiedUserId?: string, event?: AnalyticsEventInput, now = new Date()) {
    const timestamp = new Date(input.timestamp);
    const startedAt = new Date(input.sessionStartedAt);
    if (timestamp.getTime() < now.getTime() - ANALYTICS_MAX_AGE_MS ||
        timestamp.getTime() > now.getTime() + 300000 ||
        startedAt > timestamp || startedAt.getTime() < Date.UTC(2020, 0, 1)) {
      throw new AnalyticsInputError("Invalid analytics time");
    }
    // A queued guest event stays anonymous after login. Events queued for a
    // different account are never reattributed to the account sending the retry.
    const claimedUserId = input.userId && input.userId === verifiedUserId ? verifiedUserId : null;
    return database.transaction(async tx => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`analytics:${input.anonymousId}`}))`);
      if (event) {
        const [existing] = await tx.select().from(events).where(eq(events.id, event.id));
        if (existing) {
          if (existing.anonymousId !== input.anonymousId || existing.sessionId !== input.sessionId)
            throw new AnalyticsInputError("Event identity mismatch");
          return { duplicate: true };
        }
      }
      const [existingSession] = await tx.select().from(sessions).where(eq(sessions.sessionId, input.sessionId));
      if (existingSession && (existingSession.anonymousId !== input.anonymousId ||
          existingSession.platform !== input.platform || existingSession.startedAt.getTime() !== startedAt.getTime())) {
        throw new AnalyticsInputError("Session identity mismatch");
      }
      // A valid old session/token can outlive a deleted account. Downgrade to
      // anonymous, and lock a live account until the FK writes have committed.
      const account = claimedUserId
        ? (await tx.select({ id: users.id }).from(users).where(eq(users.id, claimedUserId)).for("key share"))[0]
        : undefined;
      const userId = account?.id ?? null;
      await tx.insert(visitors).values({ anonymousId: input.anonymousId, firstSeenAt: startedAt, lastSeenAt: timestamp })
        .onConflictDoUpdate({ target: visitors.anonymousId, set: {
          firstSeenAt: sql`least(${visitors.firstSeenAt}, ${startedAt})`,
          lastSeenAt: sql`greatest(${visitors.lastSeenAt}, ${timestamp})`,
        } });
      const metadata = { userId, anonymousId: input.anonymousId, sessionId: input.sessionId,
        platform: input.platform, appVersion: input.appVersion, appBuild: input.appBuild };
      if (!existingSession) {
        await tx.insert(sessions).values({ ...metadata, startedAt, lastActivityAt: timestamp });
        await tx.insert(events).values({ ...metadata, id: randomUUID(), eventName: "session_start",
          // The first delivered event may be a post-login screen while an
          // earlier guest event is still retrying. Never backdate that login.
          userId: +timestamp === +startedAt ? userId : null,
          timestamp: startedAt, screen: event?.screen ?? null, properties: {} });
      } else {
        const mixed = existingSession.multipleUsers || !!(userId && existingSession.userId && userId !== existingSession.userId);
        await tx.update(sessions).set({
          lastActivityAt: sql`greatest(${sessions.lastActivityAt}, ${timestamp})`,
          multipleUsers: mixed,
          userId: mixed ? null : existingSession.userId || userId,
        }).where(eq(sessions.sessionId, input.sessionId));
      }
      if (event) await tx.insert(events).values({ ...metadata, id: event.id, eventName: event.eventName,
        timestamp, screen: event.screen, properties: event.properties });
      return { duplicate: false };
    });
  }

  async function recordDailyVisit(userId: string, platform: string, now = new Date()) {
    const day = dubaiDay(now);
    const { start } = statsRange("today", now);
    const end = new Date(start.getTime() + 86400000);
    return database.transaction(async tx => {
      const [account] = await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("key share");
      if (!account) return false;
      const claimed = await tx.insert(visits).values({ userId, platform, day }).onConflictDoNothing().returning();
      if (!claimed.length) return false;
      // Lazy, atomic cutover: guard an existing legacy record, don't duplicate
      // or rewrite it. No data backfill script is needed in production.
      const [oldVisit] = await tx.select({ id: loginEvents.id }).from(loginEvents).where(and(
        eq(loginEvents.userId, userId), eq(loginEvents.platform, platform), eq(loginEvents.eventType, "visit"),
        sql`${loginEvents.createdAt} >= (${start.toISOString()}::timestamptz AT TIME ZONE 'UTC')`,
        sql`${loginEvents.createdAt} < (${end.toISOString()}::timestamptz AT TIME ZONE 'UTC')`,
      )).limit(1);
      if (oldVisit) return false;
      await tx.insert(loginEvents).values({ userId, platform, eventType: "visit", createdAt: now });
      return true;
    });
  }

  async function summary(now = new Date()): Promise<AnalyticsSummary> {
    const { start, end } = statsRange("today", now);
    const result = await database.execute(sql`
      SELECT count(*) FILTER (WHERE e.event_name = 'app_open')::int AS opens,
        count(distinct e.anonymous_id)::int AS visitors,
        count(distinct e.user_id)::int AS users,
        count(distinct e.anonymous_id) FILTER (WHERE v.first_seen_at >= ${start})::int AS new_visitors,
        count(distinct e.anonymous_id) FILTER (WHERE v.first_seen_at < ${start})::int AS returning,
        count(*) FILTER (WHERE e.platform = 'ios')::int AS ios,
        count(*) FILTER (WHERE e.platform = 'android')::int AS android,
        count(*) FILTER (WHERE e.platform = 'web')::int AS web
      FROM analytics_events e JOIN analytics_visitors v USING (anonymous_id)
      WHERE e.timestamp >= ${start} AND e.timestamp <= ${end}`);
    const sessionCount = await database.execute(sql`SELECT count(*)::int AS n FROM analytics_sessions WHERE started_at >= ${start} AND started_at <= ${end}`);
    const recent = await database.execute(sql`SELECT id, event_name AS "eventName", timestamp, anonymous_id AS "anonymousId",
      session_id AS "sessionId", user_id AS "userId", platform, app_version AS "appVersion", app_build AS "appBuild", screen
      FROM analytics_events ORDER BY timestamp DESC, created_at DESC LIMIT 25`);
    const row = result.rows[0] as any;
    return { timezone: REPORTING_TIMEZONE, start: start.toISOString(), end: end.toISOString(),
      appOpens: row.opens, sessions: Number(sessionCount.rows[0].n), uniqueVisitors: row.visitors,
      uniqueSignedInUsers: row.users, newAnonymousVisitors: row.new_visitors, returningAnonymousVisitors: row.returning,
      platforms: { ios: row.ios, android: row.android, web: row.web },
      recentEvents: recent.rows.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp).toISOString() })) };
  }
  return { collect, recordDailyVisit, summary };
}
export const analyticsStore = createAnalyticsStore();
