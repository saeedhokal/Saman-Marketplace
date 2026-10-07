import type { Coverage } from "@shared/analytics-reporting";

interface Bucket {
  time: string;
  end: string;
  actualStart: string;
  actualEnd: string;
  partial: boolean;
  coverage: Coverage;
}

/** Calendar buckets can differ in count across equal elapsed windows. Never
 * discard the extra prior bucket or pretend it has a current-period date. */
export function alignBuckets<T extends Bucket>(current: T[], previous: T[]) {
  return Array.from({ length: Math.max(current.length, previous.length) }, (_, index) => {
    const point: T | undefined = current[index], prior: T | undefined = previous[index];
    return {
      point,
      prior,
      row: {
        time: point?.time ?? `previous:${prior!.time}`,
        comparisonOnly: !point,
        end: point?.end,
        actualStart: point?.actualStart,
        actualEnd: point?.actualEnd,
        partial: point?.partial,
        coverage: point?.coverage,
        priorTime: prior?.time,
        priorEnd: prior?.end,
        priorActualStart: prior?.actualStart,
        priorActualEnd: prior?.actualEnd,
        priorPartial: prior?.partial,
        priorCoverage: prior?.coverage,
      },
    };
  });
}

/** A series with one observed point and many nulls needs a dot to be visible. */
export function singleObservedPoint(rows: Array<Record<string, unknown>>, key: string) {
  return rows.filter(row => typeof row[key] === "number").length === 1;
}
