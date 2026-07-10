---
name: Firebase phone-auth billing requirement
description: Firebase Phone Auth SMS requires the Blaze (billing-enabled) plan — otherwise sends fail with auth/billing-not-enabled
---

Rule: Firebase Phone Authentication will not send SMS OTPs unless the Firebase project is on the Blaze (pay-as-you-go) plan. On the free plan every send fails with `auth/billing-not-enabled`, which surfaces to users as "Failed to send verification code" and blocks all new registrations.

**Why:** All sign-ups were silently blocked in production (July 2026) until the owner upgraded the project plan in the Firebase console. Nothing in the app code was wrong.

**How to apply:** If OTP sends fail app-wide, check the `[OTP ERROR]` entries in deployment logs first (client posts Firebase error codes to `/api/log-otp-error`). `auth/billing-not-enabled` → Firebase console plan issue, not code. `auth/too-many-requests` → Firebase per-number/IP throttle, wait it out.
