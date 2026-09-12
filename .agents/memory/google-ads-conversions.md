---
name: Google Ads conversion tracking
description: Google Ads event-label constraints and the project's success-only conversion tracking approach
---

Emit conversion events only after the server confirms account creation or listing submission. Do not invent Google Ads conversion labels; the Ads account assigns opaque labels that must be supplied separately.

**Why:** Google’s manual `gtag` conversion snippet requires an `AW-.../label` destination. The project has the Ads account ID but not the two action labels, so fabricated labels would create diagnostics failures while still looking wired in code.

**How to apply:** Keep named `sign_up` and `listing_submission` events available for event-based configuration. If the real labels become available, configure the corresponding build-time variables so the helper can also send the standard Ads conversion event.