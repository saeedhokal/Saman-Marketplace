/**
 * Development-only SQL verification using connection-local TEMP tables.
 * No existing users, payments, analytics rows or public sequences are modified.
 * Run: NODE_ENV=development npx tsx scripts/verify-analytics-reporting.ts
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import type { Pool } from "pg";
import { pool } from "../server/db";
import { createReportingService, periodsFor, rollingSample } from "../server/analytics/reporting/service";
import { DAY, resolveReportContext } from "../server/analytics/reporting/range";
import * as sql from "../server/analytics/reporting/queries";
import type { AnalyticsReport, ReportContext } from "../shared/analytics-reporting";
if (process.env.NODE_ENV !== "development") throw new Error("Development-only verification");

const client = await pool.connect();
const service = createReportingService({ connect: async () => ({
  query: client.query.bind(client), release: () => {},
}) } as unknown as Pool);
const at = new Date("2026-03-11T08:00:00Z");
const context = resolveReportContext({ preset: "7d" }, at);
const start = Date.parse(context.start);
const stamp = (t: number) => new Date(t).toISOString();
const query = async (text: string, params: unknown[] = []) => (await client.query(text, params)).rows;
const eq = (a: number, b: unknown, message: string) => assert.ok(Math.abs(a - Number(b)) < 0.00001, `${message}: ${a} != ${b}`);
let checks = 0;

async function event(visitor: string, session: string, time: number, name: string, platform = "web", user: string | null = null, version: string | null = null, screen: string | null = "home", id = randomUUID()) {
  await query(`INSERT INTO analytics_events(id,event_name,timestamp,anonymous_id,session_id,platform,user_id,app_version,app_build,screen,created_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$3)`, [id, name, stamp(time), visitor, session, platform, user, version, version ? "42" : null, screen]);
}
async function session(visitor: string, time: number, duration: number, platform = "web", version: string | null = null) {
  const id = randomUUID();
  await query(`INSERT INTO analytics_sessions(session_id,anonymous_id,started_at,last_activity_at,platform,app_version,app_build)
    VALUES($1,$2,$3,$4,$5,$6,$7)`, [id, visitor, stamp(time), stamp(time + duration * 1000), platform, version, version ? "42" : null]);
  await event(visitor, id, time, "session_start", platform, null, version);
  return id;
}
async function verify(r: AnalyticsReport, detailed = true) {
  for (const period of periodsFor(r.context)) {
    const params = [period.start, period.finish, r.context.asOf];
    const actual = period.period === "current" ? r.current : r.previous;
    // Deliberately independent simple SELECTs, not the reporting GROUPING SETS.
    const [events] = await query(`SELECT
      count(*) FILTER(WHERE event_name='app_open') AS opens,
      count(*) FILTER(WHERE event_name='screen_view') AS views,
      count(DISTINCT e.anonymous_id) AS visitors, count(DISTINCT user_id) AS accounts,
      count(DISTINCT e.anonymous_id) FILTER(WHERE v.first_seen_at >= $1) AS new,
      count(DISTINCT e.anonymous_id) FILTER(WHERE v.first_seen_at < $1) AS returning
      FROM analytics_events e JOIN analytics_visitors v USING(anonymous_id)
      WHERE e.timestamp >= $1 AND e.timestamp < $2 AND e.created_at <= $3`, params);
    for (const [key, field] of Object.entries({ appOpens: "opens", screenViews: "views", visitors: "visitors", signedInUsers: "accounts", newVisitors: "new", returningVisitors: "returning" })) {
      eq(actual[key as keyof typeof actual]!, events[field], `${period.period} ${key}`); checks++;
    }
    const [s] = await query(`SELECT count(*) AS count, count(*) FILTER(WHERE last_activity_at >= started_at AND last_activity_at <= $2::timestamptz - interval '30 minutes') AS eligible,
      avg(extract(epoch FROM last_activity_at-started_at)) FILTER(WHERE last_activity_at >= started_at AND last_activity_at <= $2::timestamptz - interval '30 minutes') AS average
      FROM analytics_sessions s WHERE started_at >= $1 AND started_at < $2
      AND EXISTS(SELECT 1 FROM analytics_events e WHERE e.session_id=s.session_id AND event_name='session_start' AND created_at <= $3)`, params);
    eq(actual.sessions, s.count, "sessions"); eq(actual.completedSessions, s.eligible, "completed sessions");
    if (s.average === null) assert.equal(actual.avgSessionSeconds, null); else eq(actual.avgSessionSeconds!, s.average, "duration");
    eq(actual.sessionsPerVisitor, Number(s.count) / (Number(events.visitors) || 1), "sessions/visitor");
    eq(actual.newVisitors + actual.returningVisitors, actual.visitors, "cohort partition");
    const sample = rollingSample("", period.finish);
    const [active] = await query(`SELECT count(DISTINCT anonymous_id) FILTER(WHERE timestamp >= $2) AS dau,
      count(DISTINCT anonymous_id) FILTER(WHERE timestamp >= $1::timestamptz-interval '7 days') AS wau,
      count(DISTINCT anonymous_id) AS mau FROM analytics_events
      WHERE timestamp >= $1::timestamptz-interval '30 days' AND timestamp < $1 AND created_at <= $3`, [sample.at, sample.day_start, r.context.asOf]);
    for (const key of ["dau", "wau", "mau"] as const) eq(actual[key], active[key], key);
    eq(actual.stickiness, Number(active.dau) / (Number(active.mau) || 1) * 100, "stickiness");
    const [rev] = await query(`SELECT coalesce(sum(amount),0) total,
      coalesce(sum(amount) FILTER(WHERE category='Automotive'),0) automotive,
      coalesce(sum(amount) FILTER(WHERE category='Spare Parts'),0) spare_parts,
      count(*) purchases,count(DISTINCT user_id) paying_users FROM transactions
      WHERE status='completed' AND created_at >= ($1::timestamptz AT TIME ZONE 'UTC') AND created_at < ($2::timestamptz AT TIME ZONE 'UTC')`, params.slice(0, 2));
    const rr = period.period === "current" ? r.revenue.current : r.revenue.previous;
    for (const [key, field] of Object.entries({ total: "total", automotive: "automotive", spareParts: "spare_parts", purchases: "purchases", payingUsers: "paying_users" }))
      eq(rr[key as keyof typeof rr], rev[field], `revenue ${key}`);
    eq(rr.total, rr.automotive + rr.spareParts + rr.other, "category reconciliation");
    eq(rr.averageValue, rr.total / (rr.purchases || 1), "ATV");
    const points = period.period === "current" ? r.series.current : r.series.previous;
    for (const key of ["appOpens", "sessions", "screenViews"] as const) eq(points.reduce((a, p) => a + (p[key] || 0), 0), actual[key], `additive ${key}`);
    eq(points.reduce((a, p) => a + (p.revenue || 0), 0), rr.total, "additive revenue");
    if (detailed) for (const p of points) {
      if (p.coverage === "future") { assert.equal(p.appOpens, null); assert.equal(p.revenue, null); continue; }
      const [bucket] = await query(`SELECT count(DISTINCT anonymous_id) AS visitors, count(DISTINCT user_id) AS accounts
        FROM analytics_events WHERE timestamp >= $1 AND timestamp < $2 AND created_at <= $3`, [p.actualStart, p.actualEnd, r.context.asOf]);
      if (p.visitors !== null) eq(p.visitors, bucket.visitors, "bucket uniques");
      if (p.signedInUsers !== null) eq(p.signedInUsers, bucket.accounts, "bucket accounts");
      const rs = rollingSample("", p.actualEnd);
      const [rolling] = await query(`SELECT count(DISTINCT anonymous_id) FILTER(WHERE timestamp >= $2) AS dau,
        count(DISTINCT anonymous_id) FILTER(WHERE timestamp >= $1::timestamptz-interval '7 days') AS wau,
        count(DISTINCT anonymous_id) AS mau FROM analytics_events
        WHERE timestamp >= $1::timestamptz-interval '30 days' AND timestamp < $1 AND created_at <= $3`, [rs.at, rs.day_start, r.context.asOf]);
      for (const key of ["dau", "wau", "mau"] as const) if (p[key] !== null) eq(p[key]!, rolling[key], `point ${key}`);
      checks += 5;
    }
    checks += 20;
  }
  for (const p of r.platforms) {
    const [v] = await query(`SELECT count(DISTINCT anonymous_id) n, count(*) FILTER(WHERE event_name='app_open') opens
      FROM analytics_events WHERE timestamp >= $1 AND timestamp < $2 AND platform=$3 AND created_at <= $4`, [r.context.start, r.context.end, p.platform, r.context.asOf]);
    eq(p.visitors, v.n, "platform visitors"); eq(p.appOpens, v.opens, "platform opens"); checks += 2;
  }
  eq(r.platforms.reduce((s, p) => s + p.sessions, 0), r.current.sessions, "platform sessions sum");
  eq(r.duration.reduce((s, d) => s + d.sessions, 0), r.current.completedSessions, "duration population");
  eq(r.versions.reduce((s, v) => s + v.visitors, 0), r.versionTotal, "version denominator");
  if (r.versionTotal) eq(r.versions.reduce((s, v) => s + v.share, 0), 100, "version shares");
  const visitorDenominator = r.platforms.reduce((s, p) => s + p.visitors, 0);
  if (visitorDenominator) eq(r.platforms.reduce((s, p) => s + p.visitorShare, 0), 100, "platform shares");
  if (r.current.screenViews) eq(r.screens.reduce((s, p) => s + p.share, 0), 100, "screen shares");
}

try {
  for (const table of ["analytics_visitors", "analytics_sessions", "analytics_events", "transactions"])
    await client.query(`CREATE TEMP TABLE ${table} (LIKE public.${table} INCLUDING DEFAULTS INCLUDING INDEXES)`);
  const returning = randomUUID(), fresh = randomUUID(), native = randomUUID(), historical = randomUUID();
  for (const [id, first] of [[returning, start - 20 * DAY], [fresh, start], [native, start + 2 * DAY], [historical, start - 60 * DAY]] as const)
    await query("INSERT INTO analytics_visitors(anonymous_id,first_seen_at,last_seen_at) VALUES($1,$2,$3)", [id, stamp(first), at.toISOString()]);
  await session(historical, start - 60 * DAY, 0); // Honest fixture collection marker.
  const old = await session(returning, start - 2 * DAY, 4 * DAY / 1000);
  await event(returning, old, start - DAY, "app_open");
  await event(returning, old, start + 1000, "screen_view", "web", "fixture-account-a");
  await event(returning, old, start + 2 * DAY, "screen_view", "web", "fixture-account-a");
  const durations = [0, 29, 30, 119, 120, 299, 300, 599, 600, 1799, 1800, 7200];
  for (const [i, duration] of durations.entries()) {
    const time = start + DAY + i * 100000;
    const id = await session(fresh, time, duration);
    await event(fresh, id, time, "app_open");
    await event(fresh, id, time + 1, "screen_view", "web", i ? "fixture-account-a" : null, null, i ? "home" : null);
  }
  // iOS/web overlap, version upgrade and deterministic same-time ties.
  const ios = await session(native, start + 2 * DAY, 3600, "ios", "2.0.4");
  await event(native, ios, start + 2 * DAY, "app_open", "ios", null, "2.0.4");
  await event(native, ios, start + 2 * DAY + 500, "screen_view", "ios", "fixture-account-b", "2.0.5", "search", "00000000-0000-4000-8000-000000000001");
  await event(native, ios, start + 2 * DAY + 500, "screen_view", "ios", "fixture-account-b", "2.0.6", "search", "ffffffff-ffff-4fff-8fff-ffffffffffff");
  const android = await session(fresh, start + 3 * DAY, 0, "android");
  await event(fresh, android, start + 3 * DAY, "screen_view", "android", null, null, "other");
  await session(fresh, start + 3 * DAY, -1);
  await session(fresh, +at - 1000, 0); // Ongoing at as-of.
  await session(fresh, +at - 60000, 3600); // Future activity, not duration.
  // Two points straddling Dubai midnight belong to different day buckets.
  await event(returning, old, Date.parse("2026-03-05T19:59:59Z"), "app_open");
  await event(returning, old, Date.parse("2026-03-05T20:00:00Z"), "app_open");
  for (const [i, amount, category, status, time, user] of [
    [-1, 100, "Automotive", "completed", start + DAY, "fixture-account-a"],
    [-2, 200, "Spare Parts", "completed", start + 2 * DAY, "fixture-account-b"],
    [-3, 50, "Other", "completed", start + 3 * DAY, "fixture-account-a"],
    [-4, 0, "Automotive", "completed", start + 4 * DAY, "fixture-account-a"],
    [-5, 900, "Automotive", "pending", start + DAY, "fixture-account-a"],
    [-6, 1000, "Spare Parts", "failed", start + DAY, "fixture-account-b"],
    [-7, 80, "Automotive", "completed", start - DAY, "fixture-account-a"],
  ] as const) await query(`INSERT INTO transactions(id,user_id,amount,credits,category,status,created_at)
    VALUES($1,$2,$3,0,$4,$5,$6::timestamptz AT TIME ZONE 'UTC')`, [i, user, amount, category, status, stamp(time)]);
  const report = await service.report(context);
  await verify(report);
  assert.equal(report.current.newVisitors, 2); assert.equal(report.current.returningVisitors, 1);
  assert.equal(report.current.signedInUsers, 2); assert.equal(report.revenue.current.total, 350);
  assert.equal(report.revenue.previous.total, 80); assert.equal(report.revenue.current.other, 50);
  assert.equal(report.versions.find(v => v.platform === "ios")!.version, "2.0.6");
  assert.equal(report.versions.find(v => v.platform === "android")!.version, null);
  assert.ok(report.series.current.reduce((s, p) => s + (p.visitors || 0), 0) > report.current.visitors);
  assert.ok(report.platforms.reduce((s, p) => s + p.visitors, 0) > report.current.visitors);
  assert.equal(report.duration.at(-1)!.sessions, 3); // 30m, 2h, and native 1h.
  for (const filters of [
    { preset: "90d", interval: "week" }, { preset: "12m" }, { preset: "today" }, { preset: "24h" },
    { preset: "custom", startDate: "2026-03-05", endDate: "2026-03-08" },
  ]) await verify(await service.report(resolveReportContext(filters, at)));
  for (const screen of ["home", "search", "__unknown__"]) {
    const screenReport = await service.screenReport(context, screen);
    eq(screenReport.current.reduce((a, p) => a + (p.views || 0), 0), report.screens.find(s => s.screen === screen)!.views, "screen drilldown");
  }
  const earlier = await service.report(resolveReportContext({ preset: "custom", startDate: "2025-01-01", endDate: "2025-01-02" }, at));
  assert.equal(earlier.coverage.current, "unavailable"); assert.equal(earlier.series.current[0].visitors, null);
  const noActivity = await service.report(resolveReportContext({ preset: "custom", startDate: "2026-02-15", endDate: "2026-02-16" }, at));
  assert.equal(noActivity.coverage.current, "complete"); assert.equal(noActivity.current.appOpens, 0);
  assert.equal(noActivity.series.current[0].appOpens, 0);

  // A modest synthetic scale exercise, not a million-row benchmark.
  await query(`INSERT INTO analytics_visitors SELECT md5('report-test-'||g)::uuid,$1::timestamptz-interval '60 days',$2::timestamptz FROM generate_series(1,500) g`, [context.start, context.end]);
  await query(`INSERT INTO analytics_sessions(session_id,anonymous_id,started_at,last_activity_at,platform)
    SELECT md5('report-session-'||g)::uuid,md5('report-test-'||(g%500+1))::uuid,
    $1::timestamptz-(g%60)*interval '1 day',$1::timestamptz-(g%60)*interval '1 day'+interval '2 minutes',
    (ARRAY['ios','android','web'])[g%3+1] FROM generate_series(1,2000) g`, [context.end]);
  await query(`INSERT INTO analytics_events(id,event_name,timestamp,anonymous_id,session_id,platform,app_version,screen,created_at)
    SELECT md5('report-event-'||g)::uuid,CASE WHEN g<=2000 THEN 'session_start' WHEN g%2=0 THEN 'app_open' ELSE 'screen_view' END,
    s.started_at + (g/2001)*interval '1 minute', s.anonymous_id, s.session_id, s.platform,
    CASE WHEN s.platform <> 'web' THEN '2.'||(g%17) END, CASE WHEN g%2=1 THEN 'home' END,
    s.started_at + (g/2001)*interval '1 minute'
    FROM generate_series(1,20000) g JOIN analytics_sessions s ON s.session_id=md5('report-session-'||((g-1)%2000+1))::uuid`);
  for (const table of ["analytics_events", "analytics_visitors", "analytics_sessions", "transactions"]) await client.query(`ANALYZE ${table}`);
  const timedStart = performance.now();
  const larger = await service.report(context);
  assert.equal(larger.versionsTruncated, true); assert.ok(larger.versions.length <= 20);
  const elapsedMs = performance.now() - timedStart;
  await verify(larger);
  const args = [JSON.stringify(periodsFor(context)), context.asOf, context.interval];
  const plans: Record<string, unknown> = {};
  for (const [name, text, params] of [
    ["events", sql.eventAggregatesSql, args],
    ["sessions", sql.sessionAggregatesSql, args],
    ["rolling", sql.rollingSql, [JSON.stringify([rollingSample("current", context.end), rollingSample("previous", context.previousEnd)]), context.asOf]],
    ["collectionStart", "SELECT min(created_at) FROM analytics_events WHERE created_at <= $1::timestamptz", [context.asOf]],
  ] as const) {
    const rows = await query(`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${text}`, [...params]);
    plans[name] = rows[0]["QUERY PLAN"];
  }
  const [size] = await query("SELECT count(*) events, count(DISTINCT anonymous_id) visitors FROM analytics_events");
  const evidence = { capturedAt: new Date().toISOString(), method: "Independent direct PostgreSQL SELECTs against session-local temporary fixtures; public customer/payment data unchanged.",
    checks, fixtureCurrent: report.current, fixturePrevious: report.previous, fixtureRevenue: report.revenue,
    fixtureDuration: report.duration, fixturePlatforms: report.platforms, fixtureVersions: report.versions,
    revenueChangePercent: (350 - 80) / 80 * 100,
    scale: { events: Number(size.events), visitors: Number(size.visitors), combinedReportMs: elapsedMs, millionRowBenchmark: false },
    plans };
  await writeFile("docs/analytics-reporting-verification.json", JSON.stringify(evidence, null, 2) + "\n");
  console.log(JSON.stringify({ success: true, checks, scale: evidence.scale, evidence: "docs/analytics-reporting-verification.json" }));
} finally {
  client.release();
  await pool.end(); // TEMP tables disappear; nothing to delete from public tables.
}
