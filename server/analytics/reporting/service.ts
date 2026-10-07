import type { Pool, PoolClient } from "pg";
import { pool } from "../../db";
import type { AnalyticsReport, ReportContext, ReportMetrics, ReportPlatform, ReportPoint, ReportRevenue, ScreenReport } from "../../../shared/analytics-reporting";
import { coverage, DAY, dubaiMidnight, makeBuckets, type Bucket } from "./range";
import * as queries from "./queries";

type Row = Record<string, any>;
const platforms: ReportPlatform[] = ["ios", "android", "web"];
const iso = (value: string | Date) => new Date(value).toISOString();
const n = (value: unknown) => value === null || value === undefined ? 0 : Number(value);
const percentage = (part: number, total: number) => total ? part / total * 100 : 0;
export const periodsFor = (c: ReportContext) => [
  { period: "current", start: c.start, finish: c.end },
  { period: "previous", start: c.previousStart, finish: c.previousEnd },
];
const argsFor = (c: ReportContext) => [JSON.stringify(periodsFor(c)), c.asOf, c.interval];

function rowKey(period: string, bucket?: string | null, platform?: string | null) {
  return `${period}|${bucket || "*"}|${platform || "*"}`;
}
function indexRows(rows: Row[]) {
  return new Map(rows.map(r => [rowKey(r.period, r.all_buckets ? null : iso(r.bucket), r.all_platforms ? null : r.platform), r]));
}
function metrics(events: Row = {}, sessions: Row = {}, rolling: Row = {}): ReportMetrics {
  return {
    appOpens: n(events.app_opens), sessions: n(sessions.sessions), visitors: n(events.visitors),
    signedInUsers: n(events.signed_in_users), newVisitors: n(events.new_visitors), returningVisitors: n(events.returning_visitors),
    screenViews: n(events.screen_views), sessionsPerVisitor: n(events.visitors) ? n(sessions.sessions) / n(events.visitors) : 0,
    avgSessionSeconds: sessions.avg_session_seconds == null ? null : n(sessions.avg_session_seconds),
    completedSessions: n(sessions.completed_sessions), dau: n(rolling.dau), wau: n(rolling.wau), mau: n(rolling.mau),
    stickiness: percentage(n(rolling.dau), n(rolling.mau)),
  };
}
function revenue(r: Row = {}): ReportRevenue {
  return { total: n(r.total), automotive: n(r.automotive), spareParts: n(r.spare_parts), other: n(r.other),
    purchases: n(r.purchases), payingUsers: n(r.paying_users), averageValue: n(r.purchases) ? n(r.total) / n(r.purchases) : 0 };
}
// An exclusive midnight end belongs to the preceding Dubai calendar day.
export function rollingSample(id: string, end: string) {
  return { id, at: end, day_start: dubaiMidnight(new Date(Date.parse(end) - 1)).toISOString() };
}
export function createReportingService(database: Pool = pool) {
  let activeReports = 0;
  async function readSnapshot<T>(fn: (client: PoolClient) => Promise<T>) {
    // Do not exhaust the marketplace pool while reports are running.
    if (activeReports >= 2) throw new Error("Reporting busy; retry shortly");
    activeReports++;
    let client: PoolClient | undefined;
    try {
      client = await database.connect();
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      await client.query("SET LOCAL statement_timeout = '5s'");
      await client.query("SET LOCAL idle_in_transaction_session_timeout = '15s'");
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client?.query("ROLLBACK").catch(() => {});
      throw error;
    } finally { client?.release(); activeReports--; }
  }
  async function collectionStart(client: PoolClient, c: ReportContext): Promise<string | null> {
    const { rows } = await client.query("SELECT min(created_at) AS began FROM analytics_events WHERE created_at <= $1::timestamptz", [c.asOf]);
    return rows[0].began ? iso(rows[0].began) : null;
  }
  async function report(c: ReportContext): Promise<AnalyticsReport> {
    return readSnapshot(async client => {
      const began = await collectionStart(client, c), args = argsFor(c);
      const events = indexRows((await client.query(queries.eventAggregatesSql, args)).rows);
      const sessions = indexRows((await client.query(queries.sessionAggregatesSql, args)).rows);
      const receipts = indexRows((await client.query(queries.revenueAggregatesSql, args)).rows);
      const grids = { current: makeBuckets(c, false), previous: makeBuckets(c, true) };
      const samples = [rollingSample("current", c.end), rollingSample("previous", c.previousEnd)];
      for (const period of ["current", "previous"] as const)
        grids[period].forEach((b, i) => { if (!b.future) samples.push(rollingSample(`${period}:${i}`, b.actualEnd)); });
      const rolling = new Map((await client.query(queries.rollingSql, [JSON.stringify(samples), c.asOf])).rows.map(r => [r.id, r]));
      const screenRows = (await client.query(queries.screensSql, [c.start, c.end, c.asOf])).rows;
      const versions = (await client.query(queries.versionsSql, [c.start, c.end, c.asOf])).rows;
      const current = metrics(events.get(rowKey("current")), sessions.get(rowKey("current")), rolling.get("current"));
      const previous = metrics(events.get(rowKey("previous")), sessions.get(rowKey("previous")), rolling.get("previous"));
      const rollingCoverage = (end: string, observed: boolean) => coverage(new Date(Date.parse(end) - 30 * DAY).toISOString(), end, began, observed);
      function series(period: "current" | "previous"): ReportPoint[] {
        return grids[period].map((b, i) => {
          const event = events.get(rowKey(period, b.time)) || {}, session = sessions.get(rowKey(period, b.time)) || {};
          const observed = n(event.events) > 0 || n(session.sessions) > 0;
          const state = b.future ? "future" : coverage(b.actualStart, b.actualEnd, began, observed);
          const available = state !== "unavailable" && state !== "future";
          const rs = rolling.get(`${period}:${i}`) || {};
          const rollingState = b.future ? "future" : rollingCoverage(b.actualEnd, n(rs.mau) > 0);
          const rollingAvailable = rollingState !== "unavailable" && rollingState !== "future";
          const r = revenue(receipts.get(rowKey(period, b.time)));
          const m = metrics(event, session, rs);
          const p = Object.fromEntries(platforms.map(platform => {
            const e = events.get(rowKey(period, b.time, platform)) || {}, s = sessions.get(rowKey(period, b.time, platform)) || {};
            return [platform, { appOpens: available ? n(e.app_opens) : null, sessions: available ? n(s.sessions) : null,
              visitors: available ? n(e.visitors) : null }];
          })) as ReportPoint["platforms"];
          return { ...b, coverage: state, rollingCoverage: rollingState,
            appOpens: available ? m.appOpens : null, sessions: available ? m.sessions : null, visitors: available ? m.visitors : null,
            signedInUsers: available ? m.signedInUsers : null, newVisitors: available ? m.newVisitors : null,
            returningVisitors: available ? m.returningVisitors : null, screenViews: available ? m.screenViews : null,
            dau: rollingAvailable ? m.dau : null, wau: rollingAvailable ? m.wau : null, mau: rollingAvailable ? m.mau : null,
            revenue: b.future ? null : r.total, automotiveRevenue: b.future ? null : r.automotive,
            sparePartsRevenue: b.future ? null : r.spareParts, otherRevenue: b.future ? null : r.other, platforms: p };
        });
      }
      const platformRows = platforms.map(platform => {
        const e = events.get(rowKey("current", null, platform)) || {}, s = sessions.get(rowKey("current", null, platform)) || {};
        return { platform, appOpens: n(e.app_opens), sessions: n(s.sessions), visitors: n(e.visitors) };
      });
      const platformVisitors = platformRows.reduce((sum, p) => sum + p.visitors, 0);
      const versionTotal = versions.reduce((sum, v) => sum + n(v.visitors), 0);
      const duration = sessions.get(rowKey("current")) || {};
      return {
        context: c, coverage: { collectionStartedAt: began,
          current: coverage(c.start, c.end, began, current.visitors > 0 || current.sessions > 0),
          previous: coverage(c.previousStart, c.previousEnd, began, previous.visitors > 0 || previous.sessions > 0),
          currentRolling: rollingCoverage(c.end, current.mau > 0), previousRolling: rollingCoverage(c.previousEnd, previous.mau > 0),
          currentDau: coverage(rollingSample("", c.end).day_start, c.end, began, current.dau > 0),
          previousDau: coverage(rollingSample("", c.previousEnd).day_start, c.previousEnd, began, previous.dau > 0),
          currentWau: coverage(new Date(Date.parse(c.end) - 7 * DAY).toISOString(), c.end, began, current.wau > 0),
          previousWau: coverage(new Date(Date.parse(c.previousEnd) - 7 * DAY).toISOString(), c.previousEnd, began, previous.wau > 0),
          basis: "Earliest retained analytics_events.created_at (server receipt). No historical legacy visits are merged." },
        current, previous, revenue: { current: revenue(receipts.get(rowKey("current"))), previous: revenue(receipts.get(rowKey("previous"))) },
        series: { current: series("current"), previous: series("previous") },
        platforms: platformRows.map(p => ({ ...p, appOpenShare: percentage(p.appOpens, current.appOpens),
          sessionShare: percentage(p.sessions, current.sessions), visitorShare: percentage(p.visitors, platformVisitors) })),
        versions: versions.map(v => ({ platform: v.platform, version: v.version, build: v.build,
          visitors: n(v.visitors), share: percentage(n(v.visitors), versionTotal) })),
        versionTotal, versionsTruncated: versions.some(v => v.other),
        screens: screenRows.map(s => ({ screen: s.screen, views: n(s.views), visitors: n(s.visitors), share: percentage(n(s.views), n(s.total_views)) })),
        screenCount: n(screenRows[0]?.screen_count), screensTruncated: n(screenRows[0]?.screen_count) > 100,
        duration: ["Under 30s", "30s–2m", "2–5m", "5–10m", "10–30m", "30m+"].map((label, i) => ({ label, sessions: n(duration[`duration_${i}`]) })),
      };
    });
  }
  async function screenReport(c: ReportContext, screen: string): Promise<ScreenReport> {
    return readSnapshot(async client => {
      const began = await collectionStart(client, c);
      const rows = (await client.query(queries.screenTimeseriesSql, [...argsFor(c), screen === "__unknown__" ? null : screen])).rows;
      const values = new Map(rows.map(r => [`${r.period}|${iso(r.bucket)}`, n(r.views)]));
      function points(previous: boolean) {
        return makeBuckets(c, previous).map((b: Bucket) => {
          const views = values.get(`${previous ? "previous" : "current"}|${b.time}`) || 0;
          const state = b.future ? "future" : coverage(b.actualStart, b.actualEnd, began, views > 0);
          return { time: b.time, end: b.end, actualStart: b.actualStart, actualEnd: b.actualEnd, partial: b.partial,
            coverage: state, views: state === "future" || state === "unavailable" ? null : views };
        });
      }
      return { context: c, screen, current: points(false), previous: points(true) };
    });
  }
  return { report, screenReport };
}
export const reportingService = createReportingService();
