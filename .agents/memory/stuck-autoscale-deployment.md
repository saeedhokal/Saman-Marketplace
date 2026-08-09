---
name: Stuck autoscale deployment diagnosis
description: How to tell a stuck/unreachable autoscale deployment apart from an app-code crash for this project
---

# Stuck autoscale deployment vs code crash

**Rule:** When production (thesamanapp.com AND the replit.app URL) times out with connect failures (curl code 000) but deployment logs show only healthy requests followed by a normal `system: received signal terminated` scale-down and no startup afterwards, the deployment is stuck at the platform level — a republish replaces it and fixes it. Do not hunt for code bugs first.

**Why:** Aug 2026 outage: site fully unreachable for ~2h; logs showed clean serving until a routine autoscale scale-down at 07:06, then silence. `getDeploymentInfo` still reported a successful healthy build. Nothing in app code was at fault.

**How to apply:**
- Distinguish from the earlier (fixed) crash mode: DB pool errors produced healthcheck 500s *while the app logged errors*. A stuck deployment produces *no new log entries at all* despite incoming requests.
- Healthcheck 500 / "connection refused" bursts in the seconds right after "starting up user application" are normal boot noise, not faults.
- The app has `[FATAL-GUARD]` process-level uncaughtException/unhandledRejection handlers in server/index.ts — grep deploy logs for `FATAL-GUARD` to find swallowed async errors.
