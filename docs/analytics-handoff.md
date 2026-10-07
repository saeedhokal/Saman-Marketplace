# First-party analytics — Step 1

## Scope and definitions

This is an additive foundation, not a replacement Stats dashboard. The old Stats cards still use historical `login_events`. Revenue and payment calculations still use the existing transaction code, with no changes to that code.

The small **Admin → Stats → First-party analytics · verification** section reports:

| Metric | Definition |
| --- | --- |
| App Opens | Initial visible document/native activation and genuine foreground returns |
| Sessions | Analytics sessions started in the Dubai reporting day |
| Unique Visitors | Distinct anonymous browser/device IDs with events today; not guaranteed distinct people |
| Unique Signed-in Users | Distinct verified account IDs on today's events; never added to visitor counts |
| New Anonymous Visitors | Active visitor IDs first observed today |
| Returning Anonymous Visitors | Active visitor IDs first observed before today |
| iOS / Android / Web | Number of stored events for each platform, including session starts |
| Recent Events | Latest 25 events across all days, displayed in Asia/Dubai |

New and returning visitors are disjoint subsets of that day's unique visitors. A new account and a new anonymous visitor are different concepts. Account signups continue to use the existing registration records.

## Storage and schema

The existing PostgreSQL database now has four additive tables:

- `analytics_visitors`: anonymous UUID primary key, timezone-aware first/last seen.
- `analytics_sessions`: session UUID primary key, anonymous UUID, nullable account, started/last activity, platform, native version/build. Shared-device sessions with multiple verified accounts have `multiple_users=true` and no single account owner. Individual events retain their own attribution.
- `analytics_events`: UUID idempotency key, event name, event timestamp, server receive timestamp, nullable verified account, anonymous/session UUIDs, platform, nullable version/build, screen and allowlisted JSONB properties.
- `analytics_daily_visits`: unique `(user_id, platform, day)` guard for the legacy daily visit ledger.

Event indexes cover `(event_name, timestamp)`, `(anonymous_id, timestamp)`, `(user_id, timestamp)`, `session_id`, `(platform, timestamp)` and `timestamp`. A partial unique index permits exactly one `session_start` per session. Sessions have start-time and visitor/start-time indexes; legacy login events have an account/platform/event/date lookup index.

New timestamps use PostgreSQL `timestamptz`. Existing `login_events.created_at` is left unchanged as `timestamp without time zone`; its UTC interpretation was confirmed against the development database timezone (GMT). Stats queries explicitly convert these old timestamps to Dubai dates.

### Schema rollout

Development schema changes have been applied with `npm run db:push`; it completed without destructive changes or prompts. The existing post-merge script already runs that command, so it needs no new migration hook.

For this project's managed database, review and publish through Replit's normal schema-diff flow. **Do not select “overwrite production data.”** No custom production migration, startup DDL, historical-data deletion, or production write was run. No new dependencies or native plugins were added.

With the checked-in `capacitor.config.ts` remote-server configuration, this change does **not** require a new iOS/Android binary or `cap sync`. Existing installs load the updated shared web code after the web publish and an app reload/relaunch. The already-installed Capacitor App plugin supplies lifecycle/version information. Physical-device smoke checks are still recommended; they were not performed here.

Legacy visit guard initialization is lazy and transactional: the first request claims the unique day key, checks for an existing legacy visit that day, and inserts only if none exists. This preserves same-day history at cutover without a separate production data-backfill script. Old binaries can keep sending their existing heartbeat payload; signed-in attribution requires a real session or signed token.

## API

- `POST /api/analytics/events`: validated, single `app_open` or `screen_view` envelope; guest access supported.
- `POST /api/analytics/activity`: coalesced genuine activity/session state updates, **not** click/scroll events.
- `GET /api/admin/analytics/verification`: verified admin only; today's summary and latest records.
- Existing `GET /api/admin/login-stats?period=today`: Dubai midnight to now. Internal `period=last24hours` is separate; week/month/year retain their 7/30/365-day spans.

The server creates `session_start` atomically with the first insertion of a session. Clients do not submit that event separately. Payloads are capped at 4 KB, use strict field/property/event allowlists, and accept event times within the last 24 hours with up to 5 minutes of clock skew. Analytics has its own request limiter, so failed/retried collection cannot use up the primary shopping/auth rate-limit allowance.

Account IDs in envelopes are capture-time hints, never authentication. The server accepts them only when they match the verified cookie session or signed token. A guest event queued before login remains anonymous on retry; an event from a different account is not attributed to the account delivering it later.

A still-valid session/token for a deleted account is treated as anonymous. Its legacy daily visit is not inserted. Generated session starts are not backdated as signed-in when only a later event's identity is known.

The narrow legacy-auth change prevents an unverified `x-user-id` header from being promoted into a trusted cookie session. The new APIs never authorize from that header alone. A broader migration of old header-based authorization is outside this change.

## Client behavior

`analytics.track`, `analytics.screen`, and `analytics.identify` are centralized under `client/src/lib/analytics/`.

- A UUID and session state persist in browser/WebView local storage under `saman_analytics_v1`. Refresh, normal app restart, and sign-in retain the anonymous UUID. Clearing site/app data or reinstalling naturally resets it.
- Web Locks coordinate tabs where available, with a bounded storage-lease fallback for older WebViews.
- No active session, or **at least 30 minutes** since genuine activity, starts a session. Navigation/reload/foreground activity within that window uses the existing session.
- Genuine interactions update local activity at most once a second and server session state at most once a minute, plus a best-effort background flush. They do not create click/scroll/render events. The existing heartbeat is entirely separate and does not extend analytics sessions.
- A bounded persistent outbox retains at most 100 entries for 24 hours, with stable event IDs, exponential backoff and at most 8 delivery attempts. Failures warn without blocking user actions; old records are not kept indefinitely.
- Web uses initial visible activation, visibility changes, and page lifecycle events. Capacitor uses `appStateChange` plus an initial `getState`; duplicate initial callbacks cannot double-count an open.
- Installed native version/build comes from `App.getInfo()`. Web version/build is null.
- Meaningful route entries produce screen views. Auth mode changes have a small screen hook. Rerenders, refresh buttons and React state changes do not count as screen views.
- Query strings, hashes, search terms, tokens and free-text route slugs are not retained. Known static paths are recorded directly; dynamic listing/seller/checkout paths are normalized.

## Verification performed

Commands:

```sh
npm run check
npm test
npm run build
NODE_ENV=development npx tsx scripts/verify-analytics.ts
```

The integration script drives the real HTTP API and queries real PostgreSQL records. It verifies login continuity, event/session uniqueness, concurrent store writers and fresh backend processes, old-visit cutover, heartbeat isolation, admin protection, Dubai date grouping, and unchanged transaction count/amount. It writes `docs/analytics-verification.json` **before** removing only its isolated test fixtures.

The snapshot contains 10 stored events across two sessions: three app opens, two session starts, and five screen views. The first session has two opens and several screen views; the later session begins at the exact 30-minute inactivity boundary. All share one anonymous ID, with verified account attribution appearing after a real password login.

Type checking, 47 automated tests and the production build passed. The browser pass verified anonymous SPA navigation, password sign-in with the same anonymous/session IDs, the protected verification panel and all six metrics, Refresh/Recent Events without extra screen views, and one new app open on reload. It also found an existing Admin hook-order crash on hard reload. The hook was moved above the loading/access exits and a passing AST regression test checks that all Admin hooks precede those exits; the full browser journey was not rerun. The phone-size public landing page was visually checked after the fix; the phone-size admin panel was not captured. Test accounts and their test records were removed.

Native activation and elapsed time in this integration test are **simulated**. This is not a claim of testing on physical iOS or Android devices.

## Manual checks

1. Open the app in a fresh browser profile. Visit Home, Search, a listing and Favorites using the app links. The same anonymous/session IDs should appear with one initial app open and distinct screen views.
2. Reload. The anonymous ID and current session remain; one additional document app open is expected.
3. Sign in, browse Profile and Packages, then check the admin verification section. Subsequent events carry both the original anonymous ID and verified account ID.
4. Background and foreground the app within 30 minutes. Expect one more app open but no session start.
5. Leave it inactive for at least 30 minutes, then return. Expect a new session and exactly one session start.
6. On both physical iOS and Android, repeat launch/foreground steps and check platform and installed version/build. Check ordinary browsing, posting, seller contacts and checkout remain usable with analytics requests blocked/offline; do not perform paid test purchases unnecessarily.
7. Open Admin → Stats, choose Today, and confirm Asia/Dubai dates. The new section is always today's verification, independent of the legacy period selector.
8. Opening Recent Events or clicking Refresh must not create a screen view.

## Files

New implementation:
- `shared/analytics.ts`, `shared/models/analytics.ts`
- `server/analytics/store.ts`, `server/analytics/routes.ts`
- `client/src/lib/analytics/core.ts`, `client/src/lib/analytics/index.ts`
- `client/src/lib/analytics/compat.ts` (older-WebView UUID and request timeout support)
- `client/src/components/AnalyticsTracker.tsx`, `client/src/components/AnalyticsVerification.tsx`

Integration changes:
- `shared/schema.ts`, `shared/models/auth.ts`
- `server/routes.ts`, `server/simpleAuth.ts`, `server/index.ts` (omit verification identifiers from response logs)
- `client/src/App.tsx`, `client/src/components/Heartbeat.tsx`
- `client/src/hooks/use-auth.ts`, `client/src/pages/Auth.tsx`, `client/src/pages/Admin.tsx`

Tests/evidence:
- `tests/analytics.test.ts`
- `scripts/analytics-visit-worker.ts`, `scripts/verify-analytics.ts`
- `docs/analytics-verification.json`, this handoff
