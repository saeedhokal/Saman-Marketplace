/**
 * Development-only integration verification. Creates isolated fixtures, saves
 * actual SELECT results, and removes only those fixtures in finally.
 * Run after starting the app: NODE_ENV=development npx tsx scripts/verify-analytics.ts
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import { eq, inArray, sql } from "drizzle-orm";
import { db, pool } from "../server/db";
import { users, loginEvents, analyticsVisitors, analyticsEvents, analyticsSessions, transactions } from "../shared/schema";
import { createAnalyticsStore } from "../server/analytics/store";
import { AnalyticsClient, ANALYTICS_STORAGE_KEY } from "../client/src/lib/analytics/core";
import type { AnalyticsContext, AnalyticsEventInput } from "../shared/analytics";

if (process.env.NODE_ENV !== "development") throw new Error("Development-only verification");
const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
const userId = randomUUID(), secondId = randomUUID();
const phone = `97150${String(Date.now()).slice(-7)}`, password = randomUUID();
const anonymousIds = new Set<string>();
const run = promisify(execFile);
const worker = (platform: string) => run(process.execPath, ["--import", "tsx", "scripts/analytics-visit-worker.ts", userId, platform]);
let cookie = "";
let now = Date.now() - 50 * 60000;
const values = new Map<string, string>();
const delivered: AnalyticsEventInput[] = [];
const send = async (kind: string, body: AnalyticsContext | AnalyticsEventInput) => {
  anonymousIds.add(body.anonymousId);
  const response = await fetch(`${base}/api/analytics/${kind}`, { method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
  assert.equal(response.status, 200, await response.text());
  if (kind === "events") delivered.push(body as AnalyticsEventInput);
  return response.status;
};
const client = new AnalyticsClient({
  storage: { getItem: k => values.get(k) ?? null, setItem: (k, v) => { values.set(k, v); } },
  now: () => now, uuid: randomUUID, lock: fn => fn(), platform: "ios", send,
  warn: message => { throw new Error(message); },
});
const state = () => JSON.parse(values.get(ANALYTICS_STORAGE_KEY)!);
const originalRevenue = await db.select({ n: sql`count(*)`, sum: sql`coalesce(sum(amount),0)` }).from(transactions);
try {
  await db.insert(users).values([
    { id: userId, phone, password: await bcrypt.hash(password, 10), isAdmin: true },
    { id: secondId, isAdmin: false },
  ]);
  client.setVersion("2.0.4", "54");
  client.screen("home", { pathname: "/" }); client.setActive(true); await client.settled();
  const firstSession = state().session.id, anonymousId = state().anonymousId;
  now += 60000; client.screen("search", { pathname: "/categories" }); await client.settled();
  now += 60000; client.screen("listing_details", { pathname: "/product/:slug" }, "listing:example"); await client.settled();
  client.setActive(false); now += 3 * 60000; client.setActive(true); await client.settled();
  assert.equal(state().session.id, firstSession);
  const login = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, password, platform: "ios" }) });
  assert.equal(login.status, 200);
  cookie = login.headers.get("set-cookie")!.split(";")[0];
  client.identify(userId); now += 60000; client.screen("profile", { pathname: "/profile" }); await client.settled();
  assert.equal(state().anonymousId, anonymousId);
  client.setActive(false); now += 30 * 60000; client.setActive(true); await client.settled();
  assert.notEqual(state().session.id, firstSession);
  now += 1000; client.screen("credits", { pathname: "/profile/credits" }); await client.settled();

  // Retry and concurrent independent store instances cannot inflate rows.
  const retry = delivered[0];
  const stores = [createAnalyticsStore(), createAnalyticsStore()];
  await Promise.all(stores.map(s => s.collect(retry, undefined, retry)));
  const [duplicateCount] = await db.select({ n: sql<number>`count(*)::int` }).from(analyticsEvents).where(eq(analyticsEvents.id, retry.id));
  assert.equal(duplicateCount.n, 1);
  const rows = await db.select().from(analyticsEvents).where(eq(analyticsEvents.anonymousId, anonymousId)).orderBy(analyticsEvents.timestamp);
  const sessionRows = await db.select().from(analyticsSessions).where(eq(analyticsSessions.anonymousId, anonymousId)).orderBy(analyticsSessions.startedAt);
  assert.equal(rows.filter(r => r.eventName === "session_start").length, 2);
  assert.equal(sessionRows.length, 2);
  assert.ok(rows.some(r => r.userId === userId && r.anonymousId === anonymousId));
  assert.ok(rows.some(r => r.userId === null && r.anonymousId === anonymousId));
  assert.equal(rows.filter(r => r.eventName === "app_open" && r.sessionId === firstSession).length, 2);

  // A different account cannot rewrite session ownership or old events.
  const switched = { ...delivered.at(-1)!, id: randomUUID(), userId: secondId, timestamp: new Date(now + 1000).toISOString() };
  await stores[0].collect(switched, secondId, switched);
  const [mixed] = await db.select().from(analyticsSessions).where(eq(analyticsSessions.sessionId, switched.sessionId));
  assert.equal(mixed.multipleUsers, true); assert.equal(mixed.userId, null);
  // Old/retried activity cannot move lastActivityAt backwards.
  await stores[0].collect({ ...switched, timestamp: new Date(now).toISOString() }, secondId);
  const [afterOld] = await db.select().from(analyticsSessions).where(eq(analyticsSessions.sessionId, switched.sessionId));
  assert.equal(+afterOld.lastActivityAt, +mixed.lastActivityAt);

  // Real fresh Node processes, sharing only the database, across a full exit.
  const firstWorker = JSON.parse((await worker("android")).stdout.trim());
  const secondWorker = JSON.parse((await worker("android")).stdout.trim());
  assert.equal(firstWorker.inserted, true); assert.equal(secondWorker.inserted, false);
  const concurrentWorkers = await Promise.all([worker("web"), worker("web")]);
  assert.equal(concurrentWorkers.filter(w => JSON.parse(w.stdout.trim()).inserted).length, 1);
  // Cutover from existing legacy history also creates no duplicate.
  await db.insert(loginEvents).values({ userId, platform: "ios", eventType: "visit" });
  assert.equal(await stores[0].recordDailyVisit(userId, "ios"), false);
  const beforeHeartbeats = rows.length + 1;
  for (let i = 0; i < 3; i++) {
    const heartbeat = await fetch(`${base}/api/heartbeat`, { method: "POST", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify({ platform: "ios" }) });
    assert.equal(heartbeat.status, 200);
  }
  const [afterHeartbeat] = await db.select({ n: sql<number>`count(*)::int` }).from(analyticsEvents).where(eq(analyticsEvents.anonymousId, anonymousId));
  assert.equal(afterHeartbeat.n, beforeHeartbeats);
  const verification = await fetch(`${base}/api/admin/analytics/verification`, { headers: { Cookie: cookie } });
  assert.equal(verification.status, 200);
  const dashboard = await verification.json();
  assert.equal(dashboard.newAnonymousVisitors + dashboard.returningAnonymousVisitors, dashboard.uniqueVisitors);
  for (const headers of [{}, { "x-user-id": userId }]) {
    const denied = await fetch(`${base}/api/admin/analytics/verification`, { headers });
    assert.equal(denied.status, 401);
  }
  const invalid = await fetch(`${base}/api/analytics/events`, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...retry, eventName: "heartbeat" }) });
  assert.equal(invalid.status, 400);
  // Later authenticated event arriving first must not backdate account identity.
  const lateFirst = { ...delivered.at(-1)!, anonymousId: randomUUID(), sessionId: randomUUID(), id: randomUUID(),
    sessionStartedAt: new Date(now - 60000).toISOString() };
  await send("events", lateFirst);
  const [lateStart] = await db.select().from(analyticsEvents).where(sql`${analyticsEvents.sessionId} = ${lateFirst.sessionId} AND ${analyticsEvents.eventName} = 'session_start'`);
  assert.equal(lateStart.userId, null);
  // A claimed different user ID cannot override the real authenticated account.
  const forged = { ...lateFirst, anonymousId: randomUUID(), sessionId: randomUUID(), id: randomUUID(), userId: secondId };
  await send("events", forged);
  const [forgedEvent] = await db.select().from(analyticsEvents).where(eq(analyticsEvents.id, forged.id));
  assert.equal(forgedEvent.userId, null);
  // A deleted account can leave a still-signed cookie/token in an old client.
  const deletedAccountId = randomUUID();
  const orphan = { ...lateFirst, anonymousId: randomUUID(), sessionId: randomUUID(), id: randomUUID(), userId: deletedAccountId };
  anonymousIds.add(orphan.anonymousId);
  await stores[0].collect(orphan, deletedAccountId, orphan);
  const [orphanEvent] = await db.select().from(analyticsEvents).where(eq(analyticsEvents.id, orphan.id));
  assert.equal(orphanEvent.userId, null);
  assert.equal(await stores[0].recordDailyVisit(deletedAccountId, "ios"), false);
  const stats = await fetch(`${base}/api/admin/login-stats?period=today`, { headers: { Cookie: cookie } });
  assert.equal(stats.status, 200);
  assert.deepEqual(await db.select({ n: sql`count(*)`, sum: sql`coalesce(sum(amount),0)` }).from(transactions), originalRevenue);
  const visits = await db.select({ platform: loginEvents.platform, eventType: loginEvents.eventType })
    .from(loginEvents).where(eq(loginEvents.userId, userId));
  const evidence = {
    capturedAt: new Date().toISOString(),
    method: "Actual development HTTP + database results. Native lifecycle and elapsed time are simulated; verified sign-in is a real password login. Only isolated test fixtures are removed after capture.",
    checks: { sessionContinuity: true, exact30MinuteExpiry: true, anonymousSigninContinuity: true,
      retryIdempotency: true, concurrentProcesses: true, heartbeatCreatesNoEvents: true,
      adminAuthorization: true, revenueUnchanged: true, legacyCutover: true,
      outOfOrderIdentity: true, forgedAccountRejected: true, deletedAccountHandled: true },
    restart: { firstFreshProcess: firstWorker, secondFreshProcess: secondWorker },
    sessions: sessionRows.map(r => ({ ...r, userId: r.userId ? "[verified test account]" : null })),
    events: rows.map(r => ({ ...r, userId: r.userId ? "[verified test account]" : null })),
    legacyVisits: visits.filter(v => v.eventType === "visit"),
  };
  await mkdir("docs", { recursive: true });
  await writeFile("docs/analytics-verification.json", JSON.stringify(evidence, null, 2) + "\n");
  console.log(JSON.stringify({ success: true, events: rows.length, sessions: sessionRows.length,
    restart: evidence.restart, evidence: "docs/analytics-verification.json" }));
} finally {
  for (const id of anonymousIds) await db.delete(analyticsVisitors).where(eq(analyticsVisitors.anonymousId, id));
  await db.delete(loginEvents).where(inArray(loginEvents.userId, [userId, secondId]));
  await db.delete(users).where(inArray(users.id, [userId, secondId]));
  await pool.end();
}
