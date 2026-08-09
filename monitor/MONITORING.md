# Uptime monitoring for thesamanapp.com

Production was once down for ~2 hours before anyone noticed (Aug 9, 2026 — the
autoscale deployment got stuck after an idle shutdown). This directory contains
the monitor that catches that within minutes.

## How it works

`monitor/uptime-monitor.ts` runs as the **"Uptime Monitor" workflow in the dev
workspace** — deliberately *outside* the production deployment, so it can still
report when production is dead.

- Pings `https://thesamanapp.com/api/health` every **3 minutes** (15s timeout).
- Alerts only after **3 consecutive failures** (~9 min of downtime) — a single
  slow response never triggers a false alarm.
- Sends a **push notification to all admin devices** ("🚨 Saman is DOWN"),
  re-alerts every 30 minutes while down, and sends a "✅ back online" push on
  recovery.
- Admin device tokens are fetched from production
  (`GET /api/monitor/admin-tokens`, guarded by the shared `SESSION_SECRET`)
  while the site is healthy and cached in
  `monitor/.admin-token-cache.json`, so alerts can be sent even when
  production and its database are unreachable. Pushes go directly through
  APNs / Firebase using the same credentials as the server.

Run it manually with: `npx tsx monitor/uptime-monitor.ts`

## Important limitation

The dev-workspace monitor only runs **while the workspace is awake**. If the
workspace goes to sleep, the monitor sleeps too. For 24/7 coverage, add a free
external uptime service as a second layer:

## Recommended backup: free external uptime service (24/7)

Set up [UptimeRobot](https://uptimerobot.com) (free tier — 50 monitors, 5-min
checks):

1. Create a free account at uptimerobot.com.
2. Add a new monitor:
   - Type: **HTTP(s)**
   - URL: `https://thesamanapp.com/api/health`
   - Interval: **5 minutes**
3. Add your email (and optionally the UptimeRobot mobile app for push alerts)
   as an alert contact.

Alternatives with similar free tiers: [Better Stack](https://betterstack.com/uptime),
[Pulsetic](https://pulsetic.com), [StatusCake](https://www.statuscake.com).

Replit also shows deployment health in the Publishing → Monitoring pane, but it
does not send proactive alerts — that's what the layers above are for.

## What to do when the "DOWN" alert fires

Per past incidents: an autoscale deployment stuck after idle shutdown (curl
gives `000`, deploy logs silent after a normal scale-down) is fixed by
**republishing** the deployment — it is not a code bug.
