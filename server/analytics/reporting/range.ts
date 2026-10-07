import { z } from "zod";
import { dubaiDay } from "../../../shared/analytics";
import { reportPresets, type Coverage, type ReportContext, type ReportInterval } from "../../../shared/analytics-reporting";

export const DAY = 86400000;
const OFFSET = 4 * 3600000;
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(s => {
  const parsed = new Date(`${s}T00:00:00Z`);
  return Number.isFinite(+parsed) && parsed.toISOString().slice(0, 10) === s;
}, "Invalid calendar date");
export const reportQuerySchema = z.object({
  preset: z.enum(reportPresets).default("7d"),
  startDate: dateOnly.optional(),
  endDate: dateOnly.optional(),
  asOf: z.string().datetime().optional(),
  interval: z.enum(["hour", "day", "week", "month"]).optional(),
}).strict();
export const screenQuerySchema = reportQuerySchema.extend({
  screen: z.string().min(1).max(128),
}).strict();
export class ReportingInputError extends Error {}
export function dubaiMidnight(at: Date) { return new Date(`${dubaiDay(at)}T00:00:00+04:00`); }
export function monthsBefore(at: Date, months: number) {
  const local = new Date(+at + OFFSET), day = local.getUTCDate();
  local.setUTCDate(1); local.setUTCMonth(local.getUTCMonth() - months);
  const last = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 0)).getUTCDate();
  local.setUTCDate(Math.min(day, last));
  return new Date(+local - OFFSET);
}
export function floorBucket(at: Date, interval: ReportInterval) {
  const d = new Date(+at + OFFSET);
  d.setUTCMinutes(0, 0, 0);
  if (interval !== "hour") d.setUTCHours(0);
  if (interval === "week") d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7);
  if (interval === "month") d.setUTCDate(1);
  return new Date(+d - OFFSET);
}
export function nextBucket(at: Date, interval: ReportInterval) {
  if (interval === "month") {
    const d = new Date(+at + OFFSET); d.setUTCMonth(d.getUTCMonth() + 1); return new Date(+d - OFFSET);
  }
  return new Date(+at + ({ hour: DAY / 24, day: DAY, week: 7 * DAY }[interval]));
}
export function resolveReportContext(raw: unknown, now = new Date()): ReportContext {
  const parsed = reportQuerySchema.safeParse(raw);
  if (!parsed.success) throw new ReportingInputError(parsed.error.issues.map(i => i.message).join("; "));
  const query = parsed.data;
  const asOf = query.asOf ? new Date(query.asOf) : now;
  if (+asOf > +now || +asOf < Date.UTC(2020, 0, 1)) throw new ReportingInputError("Invalid reporting snapshot time");
  let start: Date, end = asOf, previousStart: Date, previousEnd: Date;
  let partialPeriod = false, comparisonLabel = "Immediately preceding equivalent period";
  if (query.preset === "custom") {
    if (!query.startDate || !query.endDate) throw new ReportingInputError("Choose both custom dates");
    start = new Date(`${query.startDate}T00:00:00+04:00`);
    const requestedEnd = new Date(+new Date(`${query.endDate}T00:00:00+04:00`) + DAY);
    if (query.endDate < query.startDate || +start >= +asOf || query.endDate > dubaiDay(asOf))
      throw new ReportingInputError("Choose ordered dates no later than today");
    end = new Date(Math.min(+requestedEnd, +asOf));
    previousEnd = start;
    // A partial custom last day compares equal elapsed time, with no hidden full-day mismatch.
    previousStart = new Date(+start - (+end - +start));
    partialPeriod = +end < +requestedEnd;
    comparisonLabel = partialPeriod ? "Previous equal elapsed window (selected final day is partial)" : "Previous equal-length Dubai date range";
  } else {
    if (query.startDate || query.endDate) throw new ReportingInputError("Custom dates require Custom Range");
    if (query.preset === "today") {
      start = dubaiMidnight(asOf); previousEnd = start; previousStart = new Date(+start - DAY);
      partialPeriod = true; comparisonLabel = "Today so far vs previous full Dubai calendar day";
    } else if (query.preset === "12m") {
      start = monthsBefore(asOf, 12); previousEnd = start; previousStart = monthsBefore(start, 12);
    } else {
      const days = { "24h": 1, "7d": 7, "30d": 30, "90d": 90 }[query.preset];
      start = new Date(+asOf - days * DAY); previousEnd = start; previousStart = new Date(+start - days * DAY);
    }
  }
  if (+start > +end || (+start === +end && query.preset !== "today") || +start < Date.UTC(2020, 0, 1) || +end - +start > 5 * 366 * DAY)
    throw new ReportingInputError("Reporting ranges must be positive and at most five years, from 2020 onward");
  const days = (+end - +start) / DAY;
  const interval = query.interval ?? (["today", "24h"].includes(query.preset) ? "hour" :
    query.preset === "12m" ? "month" : days <= 90 ? "day" : days <= 366 ? "week" : "month");
  const context: ReportContext = { ...query, asOf: asOf.toISOString(), timezone: "Asia/Dubai",
    start: start.toISOString(), end: end.toISOString(), previousStart: previousStart.toISOString(),
    previousEnd: previousEnd.toISOString(), interval, comparisonLabel, partialPeriod };
  makeBuckets(context, false); makeBuckets(context, true); // Enforce work bounds before SQL.
  return context;
}
export interface Bucket { time: string; end: string; actualStart: string; actualEnd: string; partial: boolean; future: boolean }
export function makeBuckets(c: ReportContext, previous: boolean): Bucket[] {
  const start = new Date(previous ? c.previousStart : c.start), end = new Date(previous ? c.previousEnd : c.end);
  const plotEnd = c.preset === "today" && !previous ? new Date(+dubaiMidnight(start) + DAY) : end;
  const buckets: Bucket[] = [];
  for (let time = floorBucket(start, c.interval); +time < +plotEnd; time = nextBucket(time, c.interval)) {
    if (buckets.length >= 400) throw new ReportingInputError("Choose a coarser interval; maximum 400 points per period");
    const next = nextBucket(time, c.interval), actualStart = new Date(Math.min(+end, Math.max(+time, +start)));
    const actualEnd = new Date(Math.min(+next, +end));
    buckets.push({ time: time.toISOString(), end: next.toISOString(), actualStart: actualStart.toISOString(),
      actualEnd: actualEnd.toISOString(), partial: +actualStart !== +time || +actualEnd !== +next, future: +time >= +end });
  }
  return buckets;
}
export function coverage(start: string, end: string, began: string | null, observed = false): Coverage {
  if (!began || end <= began) return observed ? "partial" : "unavailable";
  return start < began ? "partial" : "complete";
}
