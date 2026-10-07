/**
 * Parameterized read-only reports. All timestamps in ranges are timestamptz.
 * $1 = two periods, $2 = snapshot receipt cutoff, $3 = allowlisted grain.
 * GROUPING SETS computes range and bucket DISTINCTs independently in one scan.
 */
const periods = `WITH periods AS (
  SELECT *, $2::timestamptz AS snapshot, $3::text AS grain
  FROM jsonb_to_recordset($1::jsonb) AS p(period text, start timestamptz, finish timestamptz)
)`;
export const eventAggregatesSql = `${periods}, activity AS (
  SELECT p.period, p.start AS period_start,
    date_trunc(p.grain, e.timestamp AT TIME ZONE 'Asia/Dubai') AT TIME ZONE 'Asia/Dubai' AS bucket,
    e.platform, e.event_name, e.anonymous_id, e.user_id, v.first_seen_at
  FROM periods p JOIN analytics_events e ON e.timestamp >= p.start AND e.timestamp < p.finish AND e.created_at <= p.snapshot
  JOIN analytics_visitors v ON v.anonymous_id = e.anonymous_id
)
SELECT period, bucket, platform, grouping(bucket) AS all_buckets, grouping(platform) AS all_platforms,
  count(*) AS events,
  count(*) FILTER (WHERE event_name = 'app_open') AS app_opens,
  count(*) FILTER (WHERE event_name = 'screen_view') AS screen_views,
  count(DISTINCT anonymous_id) AS visitors, count(DISTINCT user_id) AS signed_in_users,
  count(DISTINCT anonymous_id) FILTER (WHERE first_seen_at >= period_start) AS new_visitors,
  count(DISTINCT anonymous_id) FILTER (WHERE first_seen_at < period_start) AS returning_visitors
FROM activity GROUP BY GROUPING SETS ((period), (period,bucket), (period,platform), (period,bucket,platform))`;

export const sessionAggregatesSql = `${periods}, session_activity AS (
  SELECT p.period, s.platform,
    date_trunc(p.grain, s.started_at AT TIME ZONE 'Asia/Dubai') AT TIME ZONE 'Asia/Dubai' AS bucket,
    CASE WHEN s.last_activity_at >= s.started_at AND s.last_activity_at <= p.finish - interval '30 minutes'
      THEN extract(epoch FROM s.last_activity_at - s.started_at) END AS duration
  FROM periods p JOIN analytics_sessions s ON s.started_at >= p.start AND s.started_at < p.finish
  WHERE EXISTS (SELECT 1 FROM analytics_events e WHERE e.session_id = s.session_id
    AND e.event_name = 'session_start' AND e.created_at <= p.snapshot)
)
SELECT period, bucket, platform, grouping(bucket) AS all_buckets, grouping(platform) AS all_platforms,
  count(*) AS sessions, count(duration) AS completed_sessions, avg(duration) AS avg_session_seconds,
  count(*) FILTER (WHERE duration < 30) AS duration_0,
  count(*) FILTER (WHERE duration >= 30 AND duration < 120) AS duration_1,
  count(*) FILTER (WHERE duration >= 120 AND duration < 300) AS duration_2,
  count(*) FILTER (WHERE duration >= 300 AND duration < 600) AS duration_3,
  count(*) FILTER (WHERE duration >= 600 AND duration < 1800) AS duration_4,
  count(*) FILTER (WHERE duration >= 1800) AS duration_5
FROM session_activity GROUP BY GROUPING SETS ((period), (period,bucket), (period,platform), (period,bucket,platform))`;

export const revenueAggregatesSql = `${periods}, purchases AS (
  SELECT p.period, t.amount, t.category, t.user_id,
    date_trunc(p.grain, (t.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Dubai') AT TIME ZONE 'Asia/Dubai' AS bucket
  FROM periods p JOIN transactions t ON t.created_at >= (p.start AT TIME ZONE 'UTC')
    AND t.created_at < (p.finish AT TIME ZONE 'UTC') AND t.status = 'completed'
)
SELECT period, bucket, grouping(bucket) AS all_buckets, sum(amount) AS total,
  coalesce(sum(amount) FILTER (WHERE category = 'Automotive'),0) AS automotive,
  coalesce(sum(amount) FILTER (WHERE category = 'Spare Parts'),0) AS spare_parts,
  coalesce(sum(amount) FILTER (WHERE category NOT IN ('Automotive','Spare Parts') OR category IS NULL),0) AS other,
  count(*) AS purchases, count(DISTINCT user_id) AS paying_users
FROM purchases GROUP BY GROUPING SETS ((period), (period,bucket))`;

/** One bounded range join for all rolling samples, not one network query per point. */
export const rollingSql = `WITH samples AS (
  SELECT * FROM jsonb_to_recordset($1::jsonb) AS s(id text, at timestamptz, day_start timestamptz)
)
SELECT s.id, count(DISTINCT e.anonymous_id) FILTER (WHERE e.timestamp >= s.day_start) AS dau,
  count(DISTINCT e.anonymous_id) FILTER (WHERE e.timestamp >= s.at - interval '7 days') AS wau,
  count(DISTINCT e.anonymous_id) AS mau
FROM samples s LEFT JOIN analytics_events e ON e.timestamp >= s.at - interval '30 days'
  AND e.timestamp < s.at AND e.created_at <= $2::timestamptz
GROUP BY s.id`;

export const screensSql = `SELECT coalesce(screen, '__unknown__') AS screen,
  count(*) AS views, count(DISTINCT anonymous_id) AS visitors,
  sum(count(*)) OVER () AS total_views, count(*) OVER () AS screen_count
FROM analytics_events WHERE timestamp >= $1::timestamptz AND timestamp < $2::timestamptz
  AND created_at <= $3::timestamptz AND event_name = 'screen_view'
GROUP BY screen ORDER BY views DESC, screen ASC NULLS LAST LIMIT 100`;

export const versionsSql = `WITH latest AS (
  SELECT DISTINCT ON (platform, anonymous_id) platform, anonymous_id, app_version, app_build
  FROM analytics_events WHERE timestamp >= $1::timestamptz AND timestamp < $2::timestamptz
    AND created_at <= $3::timestamptz AND platform IN ('ios','android')
  ORDER BY platform, anonymous_id, timestamp DESC, created_at DESC, id DESC
), versions AS (
  SELECT platform, app_version, app_build, count(*) AS visitors
  FROM latest GROUP BY platform, app_version, app_build
), ranked AS (
  SELECT *, row_number() OVER (PARTITION BY platform ORDER BY visitors DESC, app_version DESC NULLS LAST, app_build DESC NULLS LAST) AS rank
  FROM versions
)
SELECT platform, CASE WHEN rank > 9 THEN 'Other versions' ELSE app_version END AS version,
  CASE WHEN rank > 9 THEN NULL ELSE app_build END AS build, rank > 9 AS other,
  sum(visitors) AS visitors
FROM ranked GROUP BY platform, CASE WHEN rank > 9 THEN 'Other versions' ELSE app_version END,
  CASE WHEN rank > 9 THEN NULL ELSE app_build END, rank > 9
ORDER BY platform, visitors DESC, version DESC NULLS LAST, build DESC NULLS LAST`;

export const screenTimeseriesSql = `${periods}
SELECT p.period, date_trunc(p.grain, e.timestamp AT TIME ZONE 'Asia/Dubai') AT TIME ZONE 'Asia/Dubai' AS bucket, count(*) AS views
FROM periods p JOIN analytics_events e ON e.timestamp >= p.start AND e.timestamp < p.finish
  AND e.created_at <= p.snapshot AND e.event_name = 'screen_view'
  AND e.screen IS NOT DISTINCT FROM $4::text
GROUP BY p.period, bucket`;
