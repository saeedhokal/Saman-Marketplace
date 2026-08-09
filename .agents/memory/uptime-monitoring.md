---
name: Uptime monitoring lessons
description: Durable gotchas for the external uptime monitor and admin push alerts
---

# Uptime monitoring lessons

- **APNs `InvalidProviderToken`** happens when signing with the `APNS_AUTH_KEY` env var — that copy of the key is corrupted. Always load the .p8 key from its file in attached_assets first; env var only as fallback. **Why:** hit this live — alerts silently reached 0 devices until switching to the key file.
- **Admin device tokens exist only in the prod DB** (dev DB has none). Anything alerting from outside production must cache tokens while prod is healthy, or seed the cache from a read-only prod query.
- **A 200 from /api/health is not "up":** it used to return 200 with `status:"error"` on DB failure. Health checks must verify the parsed status, and health endpoints should return 503 on their error path.
- **How to apply:** when down-alerts misbehave, check token-cache freshness and the .p8 key file before suspecting the alert logic. Monitoring must stay outside the prod deployment.
