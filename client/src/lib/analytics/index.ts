import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { AnalyticsClient } from "./core";
import { analyticsUuid, fetchAnalytics } from "./compat";
import type { AnalyticsPlatform } from "../../../../shared/analytics";

// Older WebViews without Web Locks use a bounded, confirmed localStorage lease.
// Failure skips tracking instead of blocking the primary user action.
async function storageLock<T>(fn: () => Promise<T>): Promise<T> {
  if (navigator.locks) return navigator.locks.request("saman-analytics", fn);
  const key = "saman_analytics_lock", owner = analyticsUuid();
  for (let n = 0; n < 30; n++) {
    const previous = JSON.parse(localStorage.getItem(key) || "null");
    if (!previous || previous.until < Date.now()) {
      localStorage.setItem(key, JSON.stringify({ owner, until: Date.now() + 2000 }));
      await new Promise(r => setTimeout(r, 30));
      if (JSON.parse(localStorage.getItem(key) || "null")?.owner === owner) {
        try { return await fn(); }
        finally {
          if (JSON.parse(localStorage.getItem(key) || "null")?.owner === owner) localStorage.removeItem(key);
        }
      }
    }
    await new Promise(r => setTimeout(r, 40));
  }
  throw new Error("Analytics storage busy");
}

export const analytics = new AnalyticsClient({
  // Read lazily: private-mode storage exceptions must never break module import.
  storage: { getItem: key => localStorage.getItem(key), setItem: (key, value) => localStorage.setItem(key, value) },
  now: Date.now, uuid: analyticsUuid, lock: storageLock,
  platform: Capacitor.getPlatform() as AnalyticsPlatform,
  warn: message => console.warn(`[analytics] ${message}`),
  send: async (kind, body) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    // The server verifies this token. No tokens are persisted in the event queue.
    const token = localStorage.getItem("saman_auth_token");
    if (token) headers["x-auth-token"] = token;
    const response = await fetchAnalytics(`/api/analytics/${kind}`, { method: "POST", headers,
      credentials: "include", body: JSON.stringify(body), keepalive: true });
    return response.status;
  },
});

let running = false;
let cleanup: (() => void) | undefined;
export function startAnalytics() {
  if (running) return;
  running = true;
  try { analytics.identify(localStorage.getItem("saman_user_id")); }
  catch { console.warn("[analytics] Stored identity unavailable"); }
  let stopped = false;
  const removers: Array<() => void> = [];
  const listen = (target: EventTarget, name: string, fn: EventListener, capture = false) => {
    target.addEventListener(name, fn, { capture, passive: true });
    removers.push(() => target.removeEventListener(name, fn, capture));
  };
  const visible = () => analytics.setActive(document.visibilityState === "visible");
  const init = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const info = await Promise.race([App.getInfo(), new Promise<null>(r => setTimeout(() => r(null), 1200))]);
        if (info) analytics.setVersion(info.version, info.build);
      } catch { console.warn("[analytics] Native version unavailable"); }
      if (stopped) return;
      let lifecycleSeen = false;
      try {
        const listener = await App.addListener("appStateChange", ({ isActive }) => {
          lifecycleSeen = true;
          if (!stopped) analytics.setActive(isActive);
        });
        if (stopped) { void listener.remove(); return; }
        removers.push(() => { void listener.remove(); });
        try {
          const state = await App.getState();
          if (!stopped && !lifecycleSeen) analytics.setActive(state.isActive);
        } catch { if (!stopped && !lifecycleSeen) visible(); }
      } catch {
        console.warn("[analytics] Native lifecycle unavailable; using visibility");
        if (!stopped) { listen(document, "visibilitychange", visible); visible(); }
      }
    } else {
      listen(document, "visibilitychange", visible);
      listen(window, "pagehide", () => analytics.setActive(false));
      listen(window, "pageshow", visible);
      visible();
    }
  };
  void init().catch(() => console.warn("[analytics] Initialization unavailable"));
  for (const event of ["pointerdown", "keydown", "scroll"]) {
    listen(document, event, e => { if (e.isTrusted) analytics.activity(); }, true);
  }
  listen(window, "online", () => { void analytics.flush(); });
  const retryTimer = setInterval(() => { void analytics.flush(); }, 30000);
  cleanup = () => { stopped = true; removers.forEach(remove => remove()); clearInterval(retryTimer); running = false; };
}
export function stopAnalytics() { cleanup?.(); }
