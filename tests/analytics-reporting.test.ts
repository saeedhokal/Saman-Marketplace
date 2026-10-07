import test from "node:test";
import assert from "node:assert/strict";
import { resolveReportContext, floorBucket, nextBucket, monthsBefore, makeBuckets, coverage, DAY } from "../server/analytics/reporting/range";
import { percentChange } from "../shared/analytics-reporting";
import { alignBuckets, singleObservedPoint } from "../client/src/components/admin-analytics/alignment";
const now = new Date("2026-10-08T10:30:00.000Z");
test("Reporting defaults to a rolling seven days", () => {
  const c = resolveReportContext({}, now);
  assert.equal(c.preset, "7d"); assert.equal(c.start, "2026-10-01T10:30:00.000Z");
  assert.equal(c.previousStart, "2026-09-24T10:30:00.000Z");
  assert.equal(c.end, c.asOf); assert.equal(c.interval, "day");
});
test("Today starts at Dubai midnight and compares the prior full day", () => {
  const c = resolveReportContext({ preset: "today" }, now);
  assert.equal(c.start, "2026-10-07T20:00:00.000Z");
  assert.equal(c.previousStart, "2026-10-06T20:00:00.000Z"); assert.equal(c.previousEnd, c.start);
  assert.equal(makeBuckets(c, false).length, 24); assert.equal(makeBuckets(c, false).filter(b => b.future).length, 9);
  assert.ok(c.comparisonLabel.includes("full"));
});
test("Last 24 Hours differs from Today, with partial edge hours", () => {
  const c = resolveReportContext({ preset: "24h" }, now), buckets = makeBuckets(c, false);
  assert.equal(c.start, "2026-10-07T10:30:00.000Z"); assert.equal(buckets.length, 25);
  assert.equal(buckets[0].partial, true); assert.equal(buckets.at(-1)!.partial, true);
  assert.ok(buckets.every(b => !b.future));
});
test("Historical custom selection includes its final Dubai day", () => {
  const c = resolveReportContext({ preset: "custom", startDate: "2026-09-01", endDate: "2026-09-10" }, now);
  assert.equal(c.start, "2026-08-31T20:00:00.000Z"); assert.equal(c.end, "2026-09-10T20:00:00.000Z");
  assert.equal((Date.parse(c.end) - Date.parse(c.start)) / DAY, 10);
  assert.equal(c.previousStart, "2026-08-21T20:00:00.000Z"); assert.equal(c.partialPeriod, false);
});
test("Custom through today caps at snapshot and compares equal elapsed time", () => {
  const c = resolveReportContext({ preset: "custom", startDate: "2026-10-01", endDate: "2026-10-08" }, now);
  assert.equal(c.end, now.toISOString()); assert.equal(c.partialPeriod, true);
  assert.equal(Date.parse(c.end) - Date.parse(c.start), Date.parse(c.previousEnd) - Date.parse(c.previousStart));
  assert.match(c.comparisonLabel, /equal elapsed/);
});
test("Calendar-month windows clamp leap days and month ends", () => {
  const c = resolveReportContext({ preset: "12m" }, new Date("2024-02-29T09:00:00Z"));
  assert.equal(c.start, "2023-02-28T09:00:00.000Z"); assert.equal(c.previousStart, "2022-02-28T09:00:00.000Z");
  assert.equal(monthsBefore(new Date("2024-03-31T09:00:00Z"), 1).toISOString(), "2024-02-29T09:00:00.000Z");
  assert.equal(c.interval, "month");
});
test("Month and Monday-week boundaries are Dubai-local", () => {
  assert.equal(floorBucket(new Date("2026-09-30T22:00:00Z"), "month").toISOString(), "2026-09-30T20:00:00.000Z");
  assert.equal(floorBucket(now, "week").toISOString(), "2026-10-04T20:00:00.000Z");
  assert.equal(nextBucket(new Date("2024-01-31T20:00:00Z"), "month").toISOString(), "2024-02-29T20:00:00.000Z");
});
test("Snapshot anchors remain frozen between requests", () => {
  const first = resolveReportContext({ preset: "7d" }, now);
  assert.deepEqual(first, resolveReportContext({ preset: "7d", asOf: first.asOf }, new Date(+now + DAY)));
});
test("Weekly grouping changes points but not KPI bounds", () => {
  const a = resolveReportContext({ preset: "90d" }, now), b = resolveReportContext({ preset: "90d", interval: "week" }, now);
  assert.equal(a.start, b.start); assert.equal(a.end, b.end);
  assert.ok(makeBuckets(b, false).length < makeBuckets(a, false).length);
});
for (const query of [
  { preset: "yesterday" }, { interval: "century" }, { platform: "windows" }, { metric: "sql" },
  { startDate: "2026-10-01" }, { preset: "custom" },
  { preset: "custom", startDate: "2026-02-30", endDate: "2026-03-01" },
  { preset: "custom", startDate: "2026-10-05", endDate: "2026-10-01" },
  { preset: "custom", startDate: "2026-10-08", endDate: "2026-10-09" },
  { preset: "custom", startDate: "2020-01-01", endDate: "2026-10-01" },
  { preset: "12m", interval: "hour" }, { asOf: "2027-01-01T00:00:00Z" }, { preset: ["7d", "90d"] },
]) test(`Reject invalid/excessive query: ${JSON.stringify(query)}`, () => assert.throws(() => resolveReportContext(query, now)));
test("Missing history is not zero; observed pre-receipt data is partial", () => {
  assert.equal(coverage("2026-01-01", "2026-02-01", null), "unavailable");
  assert.equal(coverage("2026-01-01", "2026-02-01", "2026-01-15"), "partial");
  assert.equal(coverage("2026-01-01", "2026-02-01", "2026-03-01"), "unavailable");
  assert.equal(coverage("2026-01-01", "2026-02-01", "2026-03-01", true), "partial");
  assert.equal(coverage("2026-03-01", "2026-04-01", "2026-01-15"), "complete");
});
test("Zero-baseline percentages never produce infinity", () => {
  assert.equal(percentChange(5, 0), null); assert.equal(percentChange(0, 0), null);
  assert.equal(percentChange(5, -10), null);
  assert.equal(percentChange(12, 10), 20); assert.equal(percentChange(0, 10), -100);
});
test("Unequal calendar-bucket counts retain prior values without invented dates", () => {
  const current = makeBuckets(resolveReportContext({ preset: "custom", startDate: "2026-03-02", endDate: "2026-06-01" }, now), false)
    .map(b => ({ ...b, coverage: "complete" as const }));
  const previous = current.concat([{ ...current.at(-1)!, time: "2025-01-01T20:00:00Z" }]);
  const aligned = alignBuckets(current, previous);
  assert.equal(aligned.length, previous.length);
  assert.equal(aligned.at(-1)!.row.comparisonOnly, true);
  assert.equal(aligned.at(-1)!.row.actualStart, undefined);
  assert.equal(aligned.at(-1)!.row.priorTime, previous.at(-1)!.time);
  assert.equal(aligned.filter(p => !p.row.comparisonOnly).length, current.length);
});
test("Single observed point amid missing history remains visible", () => {
  assert.equal(singleObservedPoint([{ opens: null }, { opens: 0 }, { opens: null }], "opens"), true);
  assert.equal(singleObservedPoint([{ opens: null }, { opens: 3 }, { opens: 2 }], "opens"), false);
});
