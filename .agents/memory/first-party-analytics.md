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

Asia/Dubai is the business/reporting timezone throughout Admin Stats. Today means 00:00:00 through now in Asia/Dubai; Last 24 Hours is a separate range.

**Why:** The user explicitly distinguishes a Dubai calendar day from the old rolling-24-hour Today calculation.

**How to apply:** Use explicit timezone-aware boundaries and clear range labels when adding or changing daily analytics.

The 30-second heartbeat is not an analytics event and must not artificially extend sessions or inflate engagement. App opens, session starts, meaningful screen views, distinct anonymous visitors, and distinct verified users are separate metrics.

**Why:** The user explicitly requires these definitions to stay distinct, with no automatic event for every heartbeat, click, scroll, render, or React state change.

**How to apply:** A foreground return produces app_open; it produces session_start only if there is no active session or inactivity is at least 30 minutes. Login retains the anonymousId and is not a new anonymous person.

Analytics collection failures must not block login, browsing, posting listings, contacting sellers, or checkout.

**Why:** The user explicitly requires analytics to remain non-blocking for these product actions.

**How to apply:** Keep collection independent of successful completion of primary user actions, including storage, native API, and network failure cases.

Do not infer historical account ownership from the credentials delivering a retry or a later event.

**Why:** Offline guest events can arrive after login, and the first delivered event of a session can be a later signed-in screen. Backdating its account would falsely make earlier anonymous activity authenticated.

**How to apply:** Preserve capture-time event context, and keep generated session-start identity anonymous when the original start-time identity is unknown.

Dashboard metric definitions apply to the selected reporting period: new visitors are active identities first seen within it; returning visitors were first seen before it. DAU is day-level distinct identities, while WAU and MAU are trailing 7-day and 30-day distinct identities.

**Why:** The user explicitly requires consistent definitions across the analytics dashboard and comparison periods. These are browser/device identities, not guaranteed distinct physical people.

**How to apply:** Compute whole-period distinct counts directly instead of summing bucket-level uniques, anchor historical reports to their selected period, and distinguish unavailable pre-instrumentation history from measured zero activity.
