/**
 * Verified-admin HTTP checks + independent SQL checks of the actual dev data.
 * Creates only two isolated password-login fixtures. --keep-ui keeps the admin
 * for the browser pass in /tmp; --cleanup-ui removes it and its test activity.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, unlink } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { pool } from "../server/db";
import type { AnalyticsReport } from "../shared/analytics-reporting";
if (process.env.NODE_ENV !== "development") throw new Error("Development-only verification");
const fixtureFile = "/tmp/analytics-reporting-browser.json";
const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
type Fixture = { id: string; phone: string; password: string };
async function clean(id: string) {
  await pool.query(`DELETE FROM analytics_visitors WHERE anonymous_id IN
    (SELECT anonymous_id FROM analytics_events WHERE user_id=$1)`, [id]);
  await pool.query("DELETE FROM login_events WHERE user_id=$1", [id]);
  await pool.query("DELETE FROM sessions WHERE sess->>'userId'=$1", [id]);
  await pool.query("DELETE FROM users WHERE id=$1", [id]);
}
if (process.argv.includes("--cleanup-ui")) {
  const user: Fixture = JSON.parse(await readFile(fixtureFile, "utf8"));
  await clean(user.id);
  await unlink(fixtureFile);
  await pool.end();
  console.log("Temporary browser fixture removed");
} else {
  const fixtures: Fixture[] = [0, 1].map(i => ({ id: randomUUID(), phone: `971990${String(Date.now()).slice(-5)}${i}`, password: randomUUID() }));
  let keepUi = false;
  try {
    for (const [i, f] of fixtures.entries())
      await pool.query("INSERT INTO users(id,phone,password,is_admin,first_name) VALUES($1,$2,$3,$4,'Analytics QA')",
        [f.id, f.phone, await bcrypt.hash(f.password, 10), i === 0]);
    const cookies: string[] = [];
    for (const f of fixtures) {
      const r = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: f.phone, password: f.password, platform: "web" }) });
      assert.equal(r.status, 200); cookies.push(r.headers.get("set-cookie")!.split(";")[0]);
    }
    const authChecks: Record<string, number> = {};
    for (const path of ["report", "screens/timeseries?screen=home"]) {
      for (const [name, headers, expected] of [
        ["unauthenticated", {}, 401],
        ["forgedRawUserId", { "x-user-id": fixtures[0].id }, 401],
        ["forgedSignedToken", { "x-auth-token": "not-a-signed-token", "x-user-id": fixtures[0].id }, 401],
        ["nonAdmin", { Cookie: cookies[1] }, 403],
        ["nonAdminForgedAdminId", { Cookie: cookies[1], "x-user-id": fixtures[0].id }, 403],
        ["verifiedAdmin", { Cookie: cookies[0] }, 200],
      ] as const) {
        const r = await fetch(`${base}/api/admin/analytics/${path}`, { headers: headers as Record<string, string> });
        assert.equal(r.status, expected, `${path} ${name}`); authChecks[`${path}:${name}`] = r.status;
      }
    }
    const results: unknown[] = [];
    for (const preset of ["today", "24h", "7d", "30d", "90d", "12m"]) {
      const r = await fetch(`${base}/api/admin/analytics/report?preset=${preset}`, { headers: { Cookie: cookies[0] } });
      assert.equal(r.status, 200); assert.match(r.headers.get("cache-control")!, /no-store/);
      const body: AnalyticsReport = await r.json(), c = body.context;
      for (const [metrics, start, end] of [[body.current, c.start, c.end], [body.previous, c.previousStart, c.previousEnd]] as const) {
        const { rows: [direct] } = await pool.query(`SELECT
          count(*) FILTER(WHERE event_name='app_open')::int opens,
          count(*) FILTER(WHERE event_name='screen_view')::int views,
          count(DISTINCT e.anonymous_id)::int visitors,count(DISTINCT user_id)::int accounts,
          count(DISTINCT e.anonymous_id) FILTER(WHERE first_seen_at >= $1)::int new,
          count(DISTINCT e.anonymous_id) FILTER(WHERE first_seen_at < $1)::int AS returning
          FROM analytics_events e JOIN analytics_visitors v USING(anonymous_id)
          WHERE timestamp >= $1 AND timestamp < $2 AND created_at <= $3`, [start, end, c.asOf]);
        assert.deepEqual([metrics.appOpens, metrics.screenViews, metrics.visitors, metrics.signedInUsers, metrics.newVisitors, metrics.returningVisitors],
          [direct.opens, direct.views, direct.visitors, direct.accounts, direct.new, direct.returning]);
        const { rows: [sessions] } = await pool.query(`SELECT count(*)::int n FROM analytics_sessions s
          WHERE started_at >= $1 AND started_at < $2 AND EXISTS(SELECT 1 FROM analytics_events e
          WHERE e.session_id=s.session_id AND event_name='session_start' AND created_at <= $3)`, [start, end, c.asOf]);
        assert.equal(metrics.sessions, sessions.n);
      }
      const { rows: [rev] } = await pool.query(`SELECT coalesce(sum(amount),0)::float8 total,count(*)::int purchases,
        count(DISTINCT user_id)::int payers FROM transactions WHERE status='completed'
        AND created_at >= ($1::timestamptz AT TIME ZONE 'UTC') AND created_at < ($2::timestamptz AT TIME ZONE 'UTC')`, [c.start, c.end]);
      assert.equal(body.revenue.current.total, rev.total); assert.equal(body.revenue.current.purchases, rev.purchases);
      assert.equal(body.revenue.current.payingUsers, rev.payers);
      results.push({ preset, context: c, api: body.current, directSqlMatch: true, revenue: body.revenue.current });
    }
    for (const suffix of [
      "report?preset=custom&startDate=2026-02-30&endDate=2026-03-01",
      "report?preset=custom&startDate=2026-03-03&endDate=2026-03-01",
      "report?preset=12m&interval=hour", "report?metric=made_up", "report?platform=windows",
      "screens/timeseries?screen=home&interval=invalid",
    ]) {
      const r = await fetch(`${base}/api/admin/analytics/${suffix}`, { headers: { Cookie: cookies[0] } });
      assert.equal(r.status, 400, suffix);
    }
    await writeFile("docs/analytics-reporting-http-verification.json", JSON.stringify({
      capturedAt: new Date().toISOString(), method: "Actual development HTTP endpoints with real password/session authentication; independent SQL of each frozen report period.",
      authChecks, invalidInputRejected: true, results,
    }, null, 2) + "\n");
    if (process.argv.includes("--keep-ui")) {
      await writeFile(fixtureFile, JSON.stringify(fixtures[0]), { mode: 0o600 });
      keepUi = true;
    }
    console.log(JSON.stringify({ success: true, authorizationChecks: Object.keys(authChecks).length, checkedPresets: results.length,
      browserFixtureReady: keepUi, evidence: "docs/analytics-reporting-http-verification.json" }));
  } finally {
    if (!keepUi) await clean(fixtures[0].id);
    await clean(fixtures[1].id);
    await pool.end();
  }
}
