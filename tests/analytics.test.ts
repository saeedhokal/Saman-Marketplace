import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { analyticsUuid, fetchAnalytics } from "../client/src/lib/analytics/compat";
import { AnalyticsClient, ANALYTICS_STORAGE_KEY } from "../client/src/lib/analytics/core";
import { analyticsEventSchema, statsRange, screenForPath, SESSION_IDLE_MS, type AnalyticsEventInput, type AnalyticsContext } from "../shared/analytics";

function harness() {
  let now = Date.parse("2026-10-08T10:00:00Z"), status = 200;
  const values = new Map<string, string>();
  const requests: Array<{ kind: string; body: AnalyticsEventInput | AnalyticsContext }> = [];
  let lock = Promise.resolve();
  const env = {
    storage: { getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); } },
    now: () => now, uuid: randomUUID, platform: "ios" as const, warn: () => {},
    lock: async <T>(fn: () => Promise<T>) => {
      const work = lock.then(fn); lock = work.then(() => {}, () => {}); return work;
    },
    send: async (kind: string, body: AnalyticsEventInput | AnalyticsContext) => { requests.push({ kind, body }); return status; },
  };
  return { client: new AnalyticsClient(env), env, requests, values,
    state: () => JSON.parse(values.get(ANALYTICS_STORAGE_KEY)!),
    advance: (ms: number) => { now += ms; }, fail: (s: number) => { status = s; } };
}
test("initial lifecycle + React remount dedupe; native metadata and pending screen", async () => {
  const h = harness();
  h.client.setVersion("2.0.4", "54");
  h.client.screen("home", { pathname: "/" });
  h.client.setActive(true); h.client.setActive(true);
  h.client.screen("home", { pathname: "/" });
  await h.client.settled();
  assert.deepEqual(h.requests.map(r => (r.body as AnalyticsEventInput).eventName), ["app_open", "screen_view"]);
  assert.equal(h.requests[0].body.appVersion, "2.0.4");
  assert.equal(h.requests[0].body.appBuild, "54");
  assert.equal(h.requests[0].body.platform, "ios");
});
test("screens share session; foreground within 30 minutes does not create one", async () => {
  const h = harness(); h.client.setActive(true); await h.client.settled();
  const id = h.state().session.id;
  h.client.screen("search", { pathname: "/categories" });
  h.client.screen("search", { pathname: "/categories" });
  h.client.screen("listing_details", { pathname: "/product/:slug" }, "product:1");
  await h.client.settled();
  h.client.setActive(false); h.advance(29 * 60000); h.client.setActive(true); await h.client.settled();
  assert.equal(h.state().session.id, id);
  assert.equal(h.requests.filter(r => (r.body as any).eventName === "screen_view").length, 2);
  assert.equal(h.requests.filter(r => (r.body as any).eventName === "app_open").length, 2);
});
test("exact 30-minute idle boundary starts a new session; reload preserves identity", async () => {
  const h = harness(); h.client.setActive(true); await h.client.settled();
  const first = h.state();
  const reloaded = new AnalyticsClient(h.env); reloaded.setActive(true); await reloaded.settled();
  assert.equal(h.state().anonymousId, first.anonymousId);
  assert.equal(h.state().session.id, first.session.id);
  reloaded.setActive(false); h.advance(SESSION_IDLE_MS);
  reloaded.setActive(true); await reloaded.settled();
  assert.notEqual(h.state().session.id, first.session.id);
});
test("sign-in and account switch preserve anonymous ID without rewriting queued events", async () => {
  const h = harness(); h.fail(503); h.client.setActive(true); await h.client.settled();
  const id = h.state().anonymousId;
  h.client.identify("account-a"); h.client.screen("profile"); await h.client.settled();
  h.client.identify(null); h.client.screen("login"); await h.client.settled();
  h.client.identify("account-b"); h.client.screen("profile"); await h.client.settled();
  assert.equal(h.state().anonymousId, id);
  assert.deepEqual(h.state().queue.map((p: any) => p.body.userId), [null, "account-a", null, "account-b"]);
  const eventId = h.requests[0].body;
  h.advance(600000); h.fail(200); await h.client.flush();
  assert.equal(h.requests.filter(r => (r.body as any).id === (eventId as any).id).length, 2);
});
test("no passive events; activity only updates state, background does not extend it", async () => {
  const h = harness(); h.client.setActive(true); await h.client.settled();
  for (let i = 0; i < 10; i++) { h.advance(2000); h.client.activity(); }
  await h.client.settled();
  const before = h.state().session.lastActivityAt;
  h.client.setActive(false); await h.client.settled();
  h.advance(600000); h.client.activity(); await h.client.flush();
  assert.equal(h.state().session.lastActivityAt, before);
  assert.equal(h.requests.filter(r => r.kind === "events").length, 1);
});
test("two tabs coordinate anonymous/session identity; screen re-entry remains countable", async () => {
  const h = harness(), second = new AnalyticsClient(h.env);
  h.client.setActive(true); second.setActive(true);
  await Promise.all([h.client.settled(), second.settled()]);
  assert.equal(new Set(h.requests.map(r => r.body.anonymousId)).size, 1);
  assert.equal(new Set(h.requests.map(r => r.body.sessionId)).size, 1);
  h.client.screen("profile"); h.client.leaveScreen(); h.client.screen("profile"); await h.client.settled();
  assert.equal(h.requests.filter(r => (r.body as any).eventName === "screen_view").length, 2);
});
test("storage/network failure stays non-blocking and queue is bounded", async () => {
  const h = harness(); h.fail(503);
  h.client.setActive(true);
  for (let n = 0; n < 120; n++) h.client.screen("listing_details", {}, `listing:${n}`);
  await h.client.settled();
  assert.ok(h.state().queue.length <= 100);
  const broken = new AnalyticsClient({ ...h.env, storage: { getItem() { throw new Error(); }, setItem() { throw new Error(); } } });
  assert.doesNotThrow(() => { broken.setActive(true); broken.screen("home"); broken.identify("a"); broken.activity(); });
  await broken.settled();
});
test("Dubai midnight differs from last 24 hours; other spans unchanged", () => {
  const now = new Date("2026-10-07T22:00:00Z");
  assert.equal(statsRange("today", now).start.toISOString(), "2026-10-07T20:00:00.000Z");
  assert.equal(statsRange("last24hours", now).start.toISOString(), "2026-10-06T22:00:00.000Z");
  assert.equal(+now - +statsRange("week", now).start, 7 * 86400000);
  assert.equal(+now - +statsRange("month", now).start, 30 * 86400000);
  assert.equal(+now - +statsRange("year", now).start, 365 * 86400000);
  assert.equal(statsRange("today", new Date("2026-10-07T19:59:59Z")).start.toISOString(), "2026-10-06T20:00:00.000Z");
});
test("only known safe routes/properties and event names are accepted", async () => {
  const h = harness(); h.client.setActive(true); await h.client.settled();
  const valid = h.requests[0].body;
  assert.equal(analyticsEventSchema.safeParse(valid).success, true);
  for (const body of [{ ...valid, eventName: "click" }, { ...valid, eventName: "session_start" },
    { ...valid, properties: { token: "secret" } }, { ...valid, isAdmin: true },
    { ...valid, properties: { pathname: "/auth?token=secret" } }])
    assert.equal(analyticsEventSchema.safeParse(body).success, false);
  assert.equal(screenForPath("/search"), null);
  assert.equal(screenForPath("/reset-password?token=secret"), null);
  assert.deepEqual(screenForPath("/product/my-title-1?token=secret"), { screen: "listing_details", pathname: "/product/:slug" });
});

test("older iOS WebViews can generate secure UUIDs and send without AbortSignal.timeout", async () => {
  const id = analyticsUuid({ getRandomValues: (array: any) => { crypto.getRandomValues(array); return array; } });
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const response = await fetchAnalytics("/api/analytics/events", {}, async (_url, options) => {
    assert.ok(options?.signal instanceof AbortSignal);
    return new Response("{}", { status: 200 });
  });
  assert.equal(response.status, 200);
});

test("Admin hooks all precede conditional loading/access returns", () => {
  const source = ts.createSourceFile("Admin.tsx", readFileSync("client/src/pages/Admin.tsx", "utf8"),
    ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const admin = source.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.text === "Admin") as ts.FunctionDeclaration;
  assert.ok(admin?.body);
  let sawConditionalReturn = false;
  for (const statement of admin.body!.statements) {
    const visit = (node: ts.Node) => {
      // Nested handlers/components are not part of this component's render.
      if (ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node)) return;
      if (ts.isReturnStatement(node)) sawConditionalReturn = true;
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && /^use[A-Z]/.test(node.expression.text))
        assert.equal(sawConditionalReturn, false, `${node.expression.text} follows a conditional return`);
      ts.forEachChild(node, visit);
    };
    visit(statement);
  }
});
