import { ANALYTICS_MAX_AGE_MS, SESSION_IDLE_MS, type AnalyticsContext, type AnalyticsEventInput, type AnalyticsPlatform, type AnalyticsScreen } from "../../../../shared/analytics";

export const ANALYTICS_STORAGE_KEY = "saman_analytics_v1";
type Session = { id: string; startedAt: number; lastActivityAt: number };
type Pending = { id: string; kind: "events" | "activity"; body: AnalyticsContext | AnalyticsEventInput; attempts: number; nextAt: number };
type State = { anonymousId: string; session?: Session; queue: Pending[] };
type Environment = {
  storage: Pick<Storage, "getItem" | "setItem">;
  now: () => number;
  uuid: () => string;
  lock: <T>(fn: () => Promise<T>) => Promise<T>;
  send: (kind: Pending["kind"], body: Pending["body"]) => Promise<number>;
  warn: (message: string) => void;
  platform: AnalyticsPlatform;
};
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** No timers, DOM, React, credentials, or native APIs: deterministic and testable. */
export class AnalyticsClient {
  private work = Promise.resolve();
  private active = false;
  private userId: string | null = null;
  private screenKey = "";
  private currentScreen: AnalyticsScreen | null = null;
  private pendingScreen?: { screen: AnalyticsScreen; properties: AnalyticsEventInput["properties"]; key: string };
  private version: string | null = null;
  private build: string | null = null;
  private lastLocalActivity = 0;
  private lastServerActivity = 0;
  private flushing = false;
  private warned = false;
  constructor(private env: Environment) {}

  private safe(fn: () => Promise<unknown>) {
    this.work = this.work.then(fn).then(() => {}).catch(() => {
      if (!this.warned) this.env.warn("Analytics unavailable; normal app actions are unaffected.");
      this.warned = true;
    });
  }
  private read(): State {
    const raw = this.env.storage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return { anonymousId: this.env.uuid(), queue: [] };
    const state = JSON.parse(raw) as State;
    // Fail closed on corrupt storage, rather than silently minting new visitors.
    if (!uuidPattern.test(state.anonymousId) || !Array.isArray(state.queue)) throw new Error("Invalid analytics storage");
    if (state.session && (!uuidPattern.test(state.session.id) ||
        !Number.isFinite(state.session.startedAt) || !Number.isFinite(state.session.lastActivityAt)))
      throw new Error("Invalid analytics session");
    return state;
  }
  private write(state: State) {
    const oldest = this.env.now() - ANALYTICS_MAX_AGE_MS;
    state.queue = state.queue.filter(p => Date.parse(p.body.timestamp) >= oldest && p.attempts < 8).slice(-100);
    this.env.storage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(state));
  }
  private context(state: State, at: number, userId: string | null): AnalyticsContext {
    if (!state.session || at - state.session.lastActivityAt >= SESSION_IDLE_MS) {
      state.session = { id: this.env.uuid(), startedAt: at, lastActivityAt: at };
    }
    state.session.lastActivityAt = Math.max(at, state.session.lastActivityAt);
    return { anonymousId: state.anonymousId, sessionId: state.session.id,
      sessionStartedAt: new Date(state.session.startedAt).toISOString(), timestamp: new Date(at).toISOString(),
      userId, platform: this.env.platform, appVersion: this.version, appBuild: this.build };
  }
  setVersion(version: string | null, build: string | null) {
    this.version = version?.slice(0, 64) || null;
    this.build = build?.slice(0, 64) || null;
  }
  identify(userId: string | null) { this.userId = userId; }
  setActive(active: boolean) {
    if (this.active === active) return;
    if (!active) this.flushActivity();
    this.active = active;
    if (active) {
      this.track("app_open");
      if (this.pendingScreen && this.pendingScreen.key !== this.screenKey) {
        this.screenKey = this.pendingScreen.key;
        this.track("screen_view", this.pendingScreen.properties);
      }
    }
  }
  track(eventName: "app_open", properties?: AnalyticsEventInput["properties"]): void;
  track(eventName: "screen_view", properties?: AnalyticsEventInput["properties"]): void;
  track(eventName: "app_open" | "screen_view", properties: AnalyticsEventInput["properties"] = {}) {
    if (!this.active) return;
    const at = this.env.now(), userId = this.userId, screen = this.currentScreen;
    this.safe(async () => {
      await this.env.lock(async () => {
        const state = this.read();
        const body = { ...this.context(state, at, userId), id: this.env.uuid(), eventName, screen, properties };
        state.queue.push({ id: body.id, kind: "events", body, attempts: 0, nextAt: 0 });
        this.write(state);
      });
      void this.flush();
    });
  }
  screen(screen: AnalyticsScreen, properties: AnalyticsEventInput["properties"] = {}, navigationKey = screen as string) {
    this.currentScreen = screen;
    this.pendingScreen = { screen, properties, key: navigationKey };
    if (!this.active || navigationKey === this.screenKey) return;
    this.screenKey = navigationKey;
    this.track("screen_view", properties);
  }
  leaveScreen() { this.screenKey = ""; this.currentScreen = null; this.pendingScreen = undefined; }
  activity() {
    if (!this.active) return;
    const at = this.env.now(), userId = this.userId;
    if (at - this.lastLocalActivity < 1000) return;
    this.lastLocalActivity = at;
    this.safe(async () => {
      await this.env.lock(async () => {
        const state = this.read();
        const expired = !state.session || at - state.session.lastActivityAt >= SESSION_IDLE_MS;
        const body = this.context(state, at, userId);
        if (expired || at - this.lastServerActivity >= 60000) {
          // Coalesced state updates, NOT click/scroll analytics events.
          state.queue = state.queue.filter(p => p.kind !== "activity" || p.body.sessionId !== body.sessionId);
          state.queue.push({ id: this.env.uuid(), kind: "activity", body, attempts: 0, nextAt: 0 });
          this.lastServerActivity = at;
        }
        this.write(state);
      });
      void this.flush();
    });
  }
  private flushActivity() {
    const userId = this.userId;
    this.safe(async () => {
      await this.env.lock(async () => {
        const state = this.read();
        if (!state.session || this.lastLocalActivity <= this.lastServerActivity) return;
        // Use the last REAL activity time, not the time of backgrounding.
        const body: AnalyticsContext = { anonymousId: state.anonymousId, sessionId: state.session.id,
          sessionStartedAt: new Date(state.session.startedAt).toISOString(),
          timestamp: new Date(state.session.lastActivityAt).toISOString(), userId,
          platform: this.env.platform, appVersion: this.version, appBuild: this.build };
        state.queue.push({ id: this.env.uuid(), kind: "activity", body, attempts: 0, nextAt: 0 });
        this.write(state);
      });
      void this.flush();
    });
  }
  async flush() {
    if (this.flushing) return;
    this.flushing = true;
    try {
      // Short storage locks only: never hold a cross-tab lock during a request.
      for (let i = 0; i < 100; i++) {
        const pending = await this.env.lock(async () => {
          const state = this.read();
          this.write(state);
          return state.queue.find(p => p.nextAt <= this.env.now());
        });
        if (!pending) break;
        let status = 503;
        try { status = await this.env.send(pending.kind, pending.body); } catch { /* Retry below. */ }
        await this.env.lock(async () => {
          const state = this.read();
          if ((status >= 200 && status < 300) || (status >= 400 && status < 500 && status !== 429)) {
            state.queue = state.queue.filter(p => p.id !== pending.id);
          } else {
            const entry = state.queue.find(p => p.id === pending.id);
            if (entry) { entry.attempts++; entry.nextAt = this.env.now() + Math.min(300000, 5000 * 2 ** entry.attempts); }
            if (!this.warned) this.env.warn("Analytics delivery delayed; bounded retries are pending.");
            this.warned = true;
          }
          this.write(state);
        });
        if (status >= 500 || status === 429) break;
      }
    } catch {
      if (!this.warned) this.env.warn("Analytics storage unavailable.");
      this.warned = true;
    } finally { this.flushing = false; }
  }
  async settled() {
    await this.work;
    while (this.flushing) await new Promise(r => setTimeout(r, 1));
  }
}
