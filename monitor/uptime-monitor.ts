/**
 * Standalone uptime monitor for https://thesamanapp.com
 *
 * Runs OUTSIDE the production deployment (as the "Uptime Monitor" workflow in
 * the dev workspace) so it can still report when production is dead.
 *
 * Behavior:
 *  - Pings the production health endpoint every CHECK_INTERVAL_MS (3 min).
 *  - A check fails on network error, timeout (15s), or non-2xx status.
 *  - After FAILURE_THRESHOLD consecutive failures (3 = ~9 min of downtime),
 *    sends a push notification to all admin devices.
 *  - While still down, re-alerts every REALERT_INTERVAL_MS (30 min).
 *  - Sends a "recovered" push when the site comes back.
 *
 * Admin device tokens are fetched from production (/api/monitor/admin-tokens,
 * guarded by SESSION_SECRET) on every successful check and cached to disk, so
 * pushes can still be sent when production — and its database — are
 * unreachable. Pushes are sent directly via APNs / Firebase using the same
 * credentials as the server (APNS_AUTH_KEY, FIREBASE_ADMIN_CREDENTIALS).
 */

import apn from "@parse/node-apn";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const PROD_BASE = process.env.MONITOR_TARGET_URL || "https://thesamanapp.com";
const HEALTH_URL = `${PROD_BASE}/api/health`;
const TOKENS_URL = `${PROD_BASE}/api/monitor/admin-tokens`;
const CHECK_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const REQUEST_TIMEOUT_MS = 15 * 1000; // 15 seconds
const FAILURE_THRESHOLD = 3; // consecutive failures before alerting
const REALERT_INTERVAL_MS = 30 * 60 * 1000; // re-alert every 30 min while down

const CACHE_FILE = path.join(process.cwd(), "monitor", ".admin-token-cache.json");

type CachedToken = { fcmToken: string; deviceOs: string };

function log(msg: string) {
  console.log(`${new Date().toISOString()} [uptime-monitor] ${msg}`);
}

// ---------- Push sending (standalone, no prod DB dependency) ----------

let apnProvider: apn.Provider | null = null;
function getApnProvider(): apn.Provider | null {
  if (apnProvider) return apnProvider;
  // Prefer the key file (proper newlines) — same as server/pushNotifications.ts.
  let key: string | undefined;
  const keyFile = path.join(process.cwd(), "attached_assets", "AuthKey_6CM9536S2R_1769284994277.p8");
  try {
    if (fs.existsSync(keyFile)) key = fs.readFileSync(keyFile, "utf8");
  } catch {}
  if (!key) key = process.env.APNS_AUTH_KEY;
  if (!key) {
    log("APNS key not available - iOS alerts disabled");
    return null;
  }
  key = key.trim();
  if (key.includes("\\n")) key = key.replace(/\\n/g, "\n");
  if (!key.includes("\n")) {
    // Reconstruct PEM format (same normalization as server/pushNotifications.ts)
    const begin = "-----BEGIN PRIVATE KEY-----";
    const end = "-----END PRIVATE KEY-----";
    let b64 = key.replace(begin, "").replace(end, "").replace(/\s/g, "");
    const lines: string[] = [];
    for (let i = 0; i < b64.length; i += 64) lines.push(b64.substring(i, i + 64));
    key = `${begin}\n${lines.join("\n")}\n${end}`;
  }
  try {
    apnProvider = new apn.Provider({
      token: { key: Buffer.from(key, "utf8"), keyId: "6CM9536S2R", teamId: "KQ542Q98H2" },
      production: true,
    });
    return apnProvider;
  } catch (err: any) {
    log(`Failed to init APNs: ${err?.message}`);
    return null;
  }
}

let firebaseReady = false;
function initFirebase(): boolean {
  if (firebaseReady) return true;
  const creds = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!creds) {
    log("FIREBASE_ADMIN_CREDENTIALS not set - Android alerts disabled");
    return false;
  }
  try {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(creds)) });
    firebaseReady = true;
    return true;
  } catch (err: any) {
    log(`Failed to init Firebase: ${err?.message}`);
    return false;
  }
}

async function sendPush(tokens: CachedToken[], title: string, body: string): Promise<number> {
  let sent = 0;
  const deadTokens: string[] = [];
  for (const t of tokens) {
    if (!t.fcmToken || t.fcmToken.length < 20) continue;
    try {
      if (t.deviceOs === "ios") {
        const provider = getApnProvider();
        if (!provider) continue;
        const note = new apn.Notification();
        note.expiry = Math.floor(Date.now() / 1000) + 3600;
        note.sound = "default";
        note.alert = { title, body };
        note.topic = "com.saeed.saman";
        note.pushType = "alert";
        const result = await provider.send(note, t.fcmToken);
        if (result.sent.length > 0) sent++;
        else if (result.failed.length > 0) {
          const failure = result.failed[0];
          const reason = (failure.response as any)?.reason || failure.status;
          log(`APNs failed: ${reason}`);
          if (String(failure.status) === "410" || reason === "Unregistered") {
            deadTokens.push(t.fcmToken);
          }
        }
      } else {
        if (!initFirebase()) continue;
        await admin.messaging().send({
          token: t.fcmToken,
          notification: { title, body },
          android: { priority: "high", notification: { title, body, sound: "default" } },
        });
        sent++;
      }
    } catch (err: any) {
      log(`Push send error (${t.deviceOs}): ${err?.message}`);
      const code: string = err?.code || "";
      if (
        t.deviceOs !== "ios" &&
        (code === "messaging/registration-token-not-registered" ||
          code === "messaging/unregistered" ||
          /unregistered/i.test(err?.message || ""))
      ) {
        deadTokens.push(t.fcmToken);
      }
    }
  }
  if (deadTokens.length > 0) pruneCachedTokens(deadTokens);
  return sent;
}

/** Remove tokens the push provider reported as unregistered from the cache file. */
function pruneCachedTokens(deadTokens: string[]): void {
  try {
    const dead = new Set(deadTokens);
    const remaining = loadCachedTokens().filter((t) => !dead.has(t.fcmToken));
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ updatedAt: new Date().toISOString(), tokens: remaining }),
    );
    log(`Pruned ${deadTokens.length} unregistered token(s) from cache (${remaining.length} remain)`);
  } catch (err: any) {
    log(`Failed to prune token cache: ${err?.message}`);
  }
}

// ---------- Admin token cache ----------

function loadCachedTokens(): CachedToken[] {
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.tokens) ? data.tokens : [];
  } catch {
    return [];
  }
}

async function refreshTokenCache(): Promise<void> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return;
  try {
    const res = await fetchWithTimeout(TOKENS_URL, {
      headers: { "x-monitor-secret": secret },
    });
    if (!res.ok) {
      log(`Token refresh got HTTP ${res.status}`);
      return;
    }
    const data = (await res.json()) as { tokens?: CachedToken[] };
    if (Array.isArray(data.tokens) && data.tokens.length > 0) {
      fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
      fs.writeFileSync(
        CACHE_FILE,
        JSON.stringify({ updatedAt: new Date().toISOString(), tokens: data.tokens }),
      );
    }
  } catch (err: any) {
    log(`Token refresh failed: ${err?.message}`);
  }
}

// ---------- Health check loop ----------

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkHealth(): Promise<{ up: boolean; detail: string }> {
  try {
    const res = await fetchWithTimeout(HEALTH_URL, { headers: { "user-agent": "saman-uptime-monitor" } });
    if (!res.ok) return { up: false, detail: `HTTP ${res.status}` };
    // A 200 isn't enough: /api/health reports {status:"error"} when the
    // database is broken, which still means the app is down for users.
    let body: any;
    try {
      body = await res.json();
    } catch {
      return { up: false, detail: `HTTP ${res.status} but non-JSON health response` };
    }
    if (body?.status !== "ok") {
      return { up: false, detail: `HTTP ${res.status} but health status="${body?.status}" (${body?.error || "no detail"})` };
    }
    return { up: true, detail: `HTTP ${res.status}` };
  } catch (err: any) {
    const reason = err?.name === "AbortError" ? `timeout after ${REQUEST_TIMEOUT_MS / 1000}s` : err?.message || "network error";
    return { up: false, detail: reason };
  }
}

let consecutiveFailures = 0;
let alerting = false; // currently in "down" alert state
let lastAlertAt = 0;
let downSince: Date | null = null;

async function tick() {
  const { up, detail } = await checkHealth();

  if (up) {
    if (alerting) {
      const mins = downSince ? Math.round((Date.now() - downSince.getTime()) / 60000) : 0;
      log(`RECOVERED after ~${mins} min down`);
      const sent = await sendPush(
        loadCachedTokens(),
        "✅ Saman is back online",
        `thesamanapp.com recovered after ~${mins} minutes of downtime.`,
      );
      log(`Recovery alert sent to ${sent} device(s)`);
    }
    if (consecutiveFailures > 0) log(`OK (${detail}) - failure streak reset`);
    consecutiveFailures = 0;
    alerting = false;
    downSince = null;
    await refreshTokenCache();
    return;
  }

  consecutiveFailures++;
  if (!downSince) downSince = new Date();
  log(`FAIL #${consecutiveFailures}: ${detail}`);

  const shouldAlert =
    consecutiveFailures >= FAILURE_THRESHOLD &&
    (!alerting || Date.now() - lastAlertAt >= REALERT_INTERVAL_MS);

  if (shouldAlert) {
    const tokens = loadCachedTokens();
    if (tokens.length === 0) {
      log("ALERT suppressed: no cached admin device tokens (site must come up once to populate cache)");
    } else {
      const mins = Math.round((Date.now() - downSince.getTime()) / 60000);
      const sent = await sendPush(
        tokens,
        "🚨 Saman is DOWN",
        `thesamanapp.com has been unreachable for ~${mins} min (${detail}). Check the deployment - it may need a republish.`,
      );
      log(`DOWN alert sent to ${sent} device(s)`);
      alerting = true;
      lastAlertAt = Date.now();
    }
  }
}

async function main() {
  log(`Monitoring ${HEALTH_URL} every ${CHECK_INTERVAL_MS / 60000} min (alert after ${FAILURE_THRESHOLD} consecutive failures)`);
  const cached = loadCachedTokens();
  log(`Cached admin tokens: ${cached.length}`);
  // Run first check immediately, then on interval.
  await tick();
  setInterval(() => {
    tick().catch((err) => log(`tick error: ${err?.message}`));
  }, CHECK_INTERVAL_MS);
}

main();
