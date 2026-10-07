---
name: First-party analytics boundaries
description: User requirements for analytics ownership, persistence, revenue separation, and Dubai calendar-day reporting.
---

Analytics must use the project's own first-party event/session foundation in the existing database, with database/session-backed deduplication rather than server-memory-only deduplication.

**Why:** The user explicitly requires reliable analytics across server restarts and multiple server instances, without replacing the existing project database or relying on a new third-party analytics integration.

**How to apply:** Preserve persistent identities and history when extending analytics, and enforce uniqueness in durable storage rather than treating a process-local cache as the source of truth.

Financial and revenue figures must continue to come from authoritative server/database transaction records, not analytics events.

**Why:** The user explicitly requires existing transaction/revenue logic to remain intact while analytics develops.

**How to apply:** Keep behavioral analytics separate from payment accounting; do not derive or overwrite financial totals from client events.

For Admin Stats, Today means 00:00:00 through now in Asia/Dubai; Last 24 Hours is a separate range.

**Why:** The user explicitly distinguishes a Dubai calendar day from the old rolling-24-hour Today calculation.

**How to apply:** Use explicit timezone-aware boundaries and clear range labels when adding or changing daily analytics.
