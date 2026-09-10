---
name: Push notification deduplication
description: Rules preventing one listing action from producing repeated mobile alerts.
---

Deduplicate push recipients by physical device token immediately before sending. Serialize registration for the same token and replace prior ownership so concurrent Capacitor registration callbacks cannot create duplicate rows.

**Why:** Capacitor can submit the same token concurrently. Database check-then-insert logic allowed duplicate rows, causing identical notifications to be delivered more than once.

**How to apply:** Every individual and admin push path must send once per distinct token, regardless of stored duplicates.

Editing a listing that is already pending must not generate another admin notification. Notify only on initial creation or when a previously reviewed listing returns to pending.

**Why:** Sellers may correct a title, price, or photos several times before review. Each edit previously produced another alert for the same pending listing.

**How to apply:** Base resubmission alerts on the listing's previous status, not merely on receiving an update request.