# Admin Stats — Step 2 reporting handoff

## Scope and entry point

Open **Admin → Stats**. The default is **Overview / Last 7 Days / App Opens / comparison off**. The range survives navigation among Overview, Users, App Activity, Screens and Revenue. Opening Stats afresh restores the defaults.

The original fixed-Today verification panel and legacy daily-visit Stats display are no longer mixed into this dashboard. Their endpoints and historical records remain intact. Step 1 ingestion, heartbeat/Online Now, authentication, payments/accounting, marketplace behavior and the separate original Admin Revenue page are unchanged. **No Step 3 work, production writes/publishing or native binary release was performed.**

## Changed files

| Files | Purpose |
|---|---|
| `client/src/pages/Admin.tsx` | Stats-only integration; remove its legacy reporting query; lazy-load chart code only when opening Stats |
| `client/src/components/admin-analytics/AnalyticsDashboard.tsx` | Five views, global filters and chart/metric controls |
| `client/src/components/admin-analytics/report-ui.tsx` | KPI definitions/comparisons, charts, exact-value selectors, loading/error/empty states |
| `client/src/components/admin-analytics/alignment.ts` | Relative-bucket alignment without dropping extra prior buckets; single-point visibility |
| `client/src/components/admin-analytics/analytics.css` | Scoped responsive reporting styling |
| `client/src/hooks/use-analytics-report.ts` | Cancellable, cached authenticated report and lazy screen requests |
| `shared/analytics-reporting.ts` | Reporting response types and visitor/percentage definitions |
| `server/analytics/routes.ts` | Register the read-only routes using the existing verified-admin guard |
| `server/analytics/reporting/{range,queries,service,routes}.ts` | Validated contexts, parameterized PostgreSQL aggregations and API handlers |
| `tests/analytics-reporting.test.ts` | Range, comparison, validation, coverage and display-alignment regression tests |
| `scripts/verify-analytics-reporting.ts` | Isolated connection-local temporary SQL fixtures and query-plan evidence |
| `scripts/verify-analytics-reporting-http.ts` | Real development HTTP authentication/API checks against independent SQL |
| `docs/analytics-reporting-verification.json`, `docs/analytics-reporting-http-verification.json` | Timestamped verification evidence |
| `docs/analytics-reporting-handoff.md` | This handoff |

## Actual endpoints

Both endpoints require the existing verified-admin authorization, not an untrusted raw user-ID header. Responses contain aggregates only, not event, visitor, account or transaction records.

1. **`GET /api/admin/analytics/report`** — combined current/prior KPIs, timeseries, platforms, versions, ranked screens, durations and transaction revenue. A single response avoids inconsistent contexts and duplicate requests when switching internal tabs.
2. **`GET /api/admin/analytics/screens/timeseries`** — requested only for a selected screen in Screens, with the combined report's exact context and receipt cutoff.

Parameters:

- `preset`: `today`, `24h`, `7d` (default), `30d`, `90d`, `12m`, `custom`.
- `startDate`, `endDate`: valid inclusive `YYYY-MM-DD` Dubai calendar dates, only with `custom`.
- Optional `interval`: `hour`, `day`, `week`, `month`. Interval changes points, not KPI bounds.
- Optional `asOf`: validated ISO timestamp, no future snapshots, used to preserve the report context during drill-down.
- Screen endpoint additionally requires `screen`: recorded name up to 128 characters; `__unknown__` explicitly selects SQL-null screens.

Metrics and platforms are returned together; their switches select already-aggregated fields in the browser, not raw data. Unsupported query fields/metrics/platform filters are rejected, not silently ignored. Invalid input returns 400; authorization returns 401/403; overload/query failure returns an explicit 503 with Retry in the UI.

Example: `/api/admin/analytics/report?preset=7d`. Custom dates: `?preset=custom&startDate=2026-09-01&endDate=2026-09-10`.

## Time, grouping and comparisons

- All filters, buckets and displayed dates use **Asia/Dubai (UTC+4)**, independent of the browser's timezone. SQL ranges are `[start, end)`.
- **Today:** Dubai midnight → report time; compare with the previous **full** Dubai day. This intentional partial/full difference is visible. Future hourly buckets are null, never zero.
- **Last 24 Hours:** rolling exact 24 hours, distinct from Today.
- **Last 7/30/90 Days:** rolling elapsed-day windows, with immediately preceding equal elapsed windows.
- **Last 12 Months:** rolling calendar-month window; leap days/month ends clamp safely. Prior period is the immediately preceding 12 calendar months.
- **Custom:** inclusive selected dates, with exclusive next-midnight end. A selection ending today caps at `asOf`; its prior period has the same elapsed duration, rather than quietly comparing a partial period with full prior days.
- Default grain: hourly for Today/24h, daily for 7/30/90d, monthly for 12m. Custom uses days through 90 days, weeks through 366, then months.
- Both range-edge bucket bounds are returned and disclosed. Weekly grouping uses Dubai Monday boundaries. Monthly grouping uses Dubai month starts.
- Comparison lines are dashed and aligned by bucket position; exact-value details preserve actual prior dates. If calendar alignment creates an extra prior bucket, it is explicitly **Prior only**, not dropped or relabeled as a current date.
- Percentage change is `(current − previous) / previous × 100` only for a positive prior value and fully collected comparable populations. A true zero baseline shows New activity or no percentage. Missing history is not a zero baseline. Zero/zero, null duration, and negative transaction baselines never produce infinity.

## Main KPI SQL and metric definitions

Executable SQL is in `server/analytics/reporting/queries.ts`. The simplified main event calculation is:

```sql
SELECT
  count(*) FILTER (WHERE event_name = 'app_open') AS app_opens,
  count(*) FILTER (WHERE event_name = 'screen_view') AS screen_views,
  count(DISTINCT e.anonymous_id) AS visitors,
  count(DISTINCT e.user_id) AS signed_in_users,
  count(DISTINCT e.anonymous_id)
    FILTER (WHERE v.first_seen_at >= $1) AS new_visitors,
  count(DISTINCT e.anonymous_id)
    FILTER (WHERE v.first_seen_at < $1) AS returning_visitors
FROM analytics_events e
JOIN analytics_visitors v USING (anonymous_id)
WHERE e.timestamp >= $1 AND e.timestamp < $2 AND e.created_at <= $3;
```

`$1/$2` are the selected bounds; `$3` is the receipt cutoff. Actual reporting uses grouping sets to compute period, bucket, platform and bucket/platform aggregates independently from common scans.

- **Sessions:** count `analytics_sessions.started_at` within the period, with a recorded `session_start` received by the snapshot. This is not “sessions active in the period.”
- **Visitors / signed-in users:** distinct anonymous identities / distinct verified non-null event user IDs. Never add these populations together. Bucket and platform uniques are non-additive; period uniques are calculated directly.
- **New / returning:** active identities first seen within the selected period / before its start. Their partition is fixed to that period across its trend, not reclassified daily or derived from signup dates.
- **Sessions per visitor:** period session starts / period distinct visitors, zero when the denominator is zero.
- Exact visitor definition: “Unique browser/device analytics identities. One person using multiple devices may count more than once.”

### DAU / WAU / MAU

Anchored to the selected range's end, not the current wall clock. A historical exclusive midnight endpoint belongs to the preceding Dubai day.

- DAU: distinct event identities from that Dubai day's start through the endpoint.
- WAU: distinct identities in trailing exact 7 days.
- MAU: distinct identities in trailing exact 30 days.
- Stickiness: DAU / MAU × 100, safely zero with no MAU.

Trend points use each bucket's actual end and look back beyond the visible range when needed. One bounded SQL join handles all samples; it does not send one query/request per point. Card coverage is metric-specific (day, 7 days, 30 days). Trend tooltips disclose incomplete 30-day lookback coverage.

### Observed session duration

For sessions started in the selected range, duration is `last_activity_at − started_at`. It is eligible only if non-inverted and last activity was at least 30 minutes before the selected endpoint. Ongoing/future/invalid sessions are excluded; no eligible sessions yields a null average, not an invented zero.

Bins share that population: `[0,30)`, `[30,120)`, `[120,300)`, `[300,600)`, `[600,1800)`, `[1800,∞)` seconds. Long recorded sessions are **not** capped at 30 minutes. Observed duration does not imply continuous attention.

### Platforms, versions and screens

- Platform values come from the recorded fields, not new user-agent inference. Opens and sessions reconcile with period totals. Visitor shares use the sum of platform/identity populations because one identity can appear on multiple platforms.
- Native adoption chooses the latest event's version/build per `(platform, anonymous_id)` in the selected range, ordered deterministically by captured time, receipt time, then event UUID. Unknown version/build remains explicit; Web is not applicable.
- Show the top nine version groups per native platform plus an accurately reconciled Other group where needed. Shares use all active native platform/identity pairs, not global people.
- Screen ranks use `screen_view` only; shares divide by **all** screen views. Chart shows top 12, table at most 100, with limits and omissions disclosed. The screen drill-down shares the same frozen range/cutoff.

### Revenue

Read-only aggregation of **`transactions.status = 'completed'`**, using existing integer AED amounts without VAT/package-price recalculation.

```sql
SELECT coalesce(sum(amount), 0) AS total,
       count(*) AS purchases,
       count(DISTINCT user_id) AS paying_users
FROM transactions
WHERE status = 'completed'
  AND created_at >= ($1::timestamptz AT TIME ZONE 'UTC')
  AND created_at <  ($2::timestamptz AT TIME ZONE 'UTC');
```

Automotive and Spare Parts use exact stored category values. Other/null categories remain in Total and appear as a disclosed residual. Average transaction value = completed amount sum / completed row count (zero when no rows). Historical transaction coverage is independent of behavioral collection. Timestamp-without-timezone values are explicitly interpreted as UTC before Dubai grouping.

## History, safety and performance

- Collection start is the earliest retained `analytics_events.created_at` (server receipt); there is no separate collection marker. Legacy login visits are never merged. Pre-collection buckets are unavailable/null, observed late-arriving pre-receipt data is partial, and collected empty buckets are genuine zero.
- Each combined response uses a **read-only repeatable-read transaction**. `asOf` fixes periods and event receipt cutoff; it is **not** an immutable audit snapshot that can reproduce mutable source rows forever.
- Parameterized SQL, strict field/interval validation, earliest current range start 2020, custom range limit 1,830 elapsed days, and maximum 400 buckets **per period**. Screen rankings and version groups are bounded. No raw-event table is exposed.
- Existing indexes are reused. Maximum two in-flight reporting operations per server process, 5-second per-statement timeout, 15-second idle-transaction timeout, and 40 authorized report requests/minute/IP. Saturation fails explicitly instead of monopolizing the marketplace pool.
- Existing client cache: 60-second freshness, 5-minute garbage collection, abort signals, no focus refetch, no automatic retry. Screens are lazy, reused on internal tab reentry, and refreshed with a new main context. HTTP responses are private/no-store.
- Dashboard/chart code is lazy-loaded only for Stats (production chunk approximately 427 KB / 117 KB gzipped in this build), not added to the initial marketplace bundle.
- **No migration, new database, materialized view, background job, package installation or ingestion change is required.** Step 1 tables must already exist.

## Verification and evidence

Commands:

```bash
npm run check
npm test
npm run build
NODE_ENV=development npx tsx scripts/verify-analytics-reporting.ts
NODE_ENV=development npx tsx scripts/verify-analytics-reporting-http.ts
```

For a browser pass, the HTTP script supports `--keep-ui` and subsequent `--cleanup-ui`. Its randomly generated isolated account is temporary; credentials are kept only in a restricted `/tmp` file and are not part of this handoff.

- SQL fixture verification: **1,296 assertions**. It uses connection-local PostgreSQL temporary tables cloned from the real schema. No public customer/payment rows or sequences are altered.
- Fixtures cover repeated identities, guest-to-user continuity, selected-period cohorts, Dubai midnight, duration boundaries/invalid/ongoing/long sessions, cross-platform overlap, unknown/native version upgrades and tie-breaking, zero/partial/unavailable history, completed/pending/failed transactions, custom/weekly/monthly grouping and additive/non-additive invariants.
- Synthetic financial example: current completed revenue **AED 350** (Automotive 100 + Spare Parts 200 + Other 50), prior **AED 80**, four current completed purchases, two payers, ATV **AED 87.50**, change **+337.5%**. Pending/failed rows excluded.
- Actual development HTTP reports: all **six presets** independently matched direct SQL for current/prior opens, sessions, visitors, accounts, cohorts and screen views, plus completed revenue/purchases/payers. The saved 7-day snapshot had 5 opens, 3 sessions, 2 visitors, 0 signed-in users, 2 new/0 returning, 1 screen view, and AED 0 revenue. These are timestamped observations, not expected permanent counts.
- Authorization: **12 checks** across the two endpoints — no auth, forged raw ID, forged token, non-admin, non-admin plus forged admin ID, and valid admin. Invalid/excessive query requests also rejected.
- Saved evidence: `docs/analytics-reporting-verification.json` and `docs/analytics-reporting-http-verification.json`, including contexts, values and EXPLAIN plans.
- Synthetic scale actually tested: **20,052 events / 504 identities**, combined 7-day report approximately **220 ms**. Representative EXPLAIN execution times: event aggregate 9.33 ms; sessions 2.62 ms; two rolling samples 18.28 ms; collection-start lookup 2.80 ms. The full combined timing includes its full bucket rolling samples. These do **not** prove million-row or production performance.
- Type checking and production build passed. The full unit suite passes, including the existing Admin hook-order regression and Step 1 analytics tests. Existing large-bundle warnings remain outside this reporting scope.
- One authenticated browser pass succeeded at 1440×1000 and simulated 390×844: all five tabs, exact visitor definition, obvious metric overlays, comparison toggle, Today versus 24h bounds, shared ranges, screen drill-down receipt cutoff, inclusive custom dates, invalid reversed dates, one simulated 503 followed by successful Retry, hard reload/default restoration, and mobile point selection. Document/body widths remained 390px with no page overflow. The screen table scrolls internally.
- The browser's captured refresh response at `2026-10-07T21:56:25.999Z` matched the displayed cards: **8 opens, 3 visitors, 4 sessions, 1 signed-in user**. This was a newer snapshot including the isolated browser test's activity; no mismatch was inferred from comparing different refreshes.
- No hook-order or runtime errors occurred in the completed journey. One initial development navigation timed out while blank, then reloading worked; the subsequent requested hard-reload test passed. A non-fatal Vite Fast Refresh warning occurred during development hot updates.
- Final review retained visible dots for isolated collected points, all aligned prior buckets, integer count-axis ticks, and Stats-only bottom clearance for the existing mobile app banner/navigation. These targeted display changes were checked by type/unit/build validation; no second full browser pass was run.

## Known limits

- Pre-Step-1 detailed behavior cannot be reconstructed. First-seen data can be corrected by late arrivals; mutable session rows and current transaction status are not historically versioned. Rerunning the same cutoff later may therefore change some historical classifications/durations/financial status.
- The collection-start receipt proves the earliest retained data, not a guarantee that every device delivered every event after that time. Client outages, offline queues, deleted records and retention changes affect coverage.
- Session last-activity history is not an audit trail; a session whose stored activity extends beyond a historical endpoint is excluded from that endpoint's eligible-duration population rather than fabricated/truncated.
- Version adoption counts browser/device identities, not installations or physical people.
- Only the disclosed top screen/version groups are displayed. There is no export, raw-event explorer, acquisition/search/contact/funnel reporting or advanced retention.
- Query plans were inspected at the stated modest synthetic scale, not millions of production events. Broader ranges at future scale can hit the explicit query timeout. Re-measure before introducing an index/cache/materialized view.
- Phone-sized browser checks are not a physical iOS/Android or Capacitor binary test.

**Stop point: Step 2 only.**
