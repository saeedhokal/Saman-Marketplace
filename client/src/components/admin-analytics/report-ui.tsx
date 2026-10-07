import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type {
  AnalyticsReport,
  Coverage,
  ReportMetrics,
  ReportRevenue,
} from "@shared/analytics-reporting";
import { VISITOR_EXPLANATION, percentChange } from "@shared/analytics-reporting";
import { singleObservedPoint } from "./alignment";

export const colors = ["#e16b27", "#298c83", "#537fad", "#b28b35", "#ab6581"];
export const number = (value: number) =>
  new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(value);
export const money = (value: number) =>
  `AED ${new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;

export function dubai(value: string, short = false, hourly = false) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dubai",
    day: "numeric",
    month: "short",
    ...(!short
      ? ({ year: "numeric", hour: "2-digit", minute: "2-digit" } as const)
      : hourly
        ? ({ hour: "2-digit", minute: "2-digit" } as const)
        : {}),
  }).format(new Date(value));
}

export const screenName = (screen: string) =>
  screen === "__unknown__" ? "Unknown screen" : screen;

export const definitions: Record<keyof ReportMetrics | keyof ReportRevenue, string> = {
  appOpens: "Actual recorded app_open foreground/open events; not legacy daily visits.",
  sessions: "Sessions started within the selected period, using the existing 30-minute inactivity rule.",
  visitors: VISITOR_EXPLANATION,
  signedInUsers: "Distinct verified signed-in account IDs recorded in analytics during the period. Do not add these to visitor identities.",
  newVisitors: `Active identities first seen within the selected period, not account registrations. ${VISITOR_EXPLANATION}`,
  returningVisitors: `Active identities first seen before the selected period. ${VISITOR_EXPLANATION}`,
  screenViews: "Actual recorded screen_view events during the selected period.",
  sessionsPerVisitor: "Sessions started in the selected period / distinct active visitor identities in that period. Zero visitors yields zero.",
  avgSessionSeconds: "Last recorded activity minus session start. Only valid sessions started in the range and inactive for at least 30 minutes at report as-of are eligible. Observed activity is not guaranteed continuous attention.",
  completedSessions: "Valid sessions started in the selected range, inactive for at least 30 minutes at the report as-of endpoint.",
  dau: `Distinct active identities during the Dubai calendar day at the selected as-of endpoint. ${VISITOR_EXPLANATION}`,
  wau: `Distinct active identities in the trailing 7 days at the selected as-of endpoint; not summed DAU. ${VISITOR_EXPLANATION}`,
  mau: `Distinct active identities in the trailing 30 days at the selected as-of endpoint; not summed DAU. ${VISITOR_EXPLANATION}`,
  stickiness: "DAU / MAU × 100 at the selected as-of endpoint. Zero MAU yields zero.",
  total: "Sum of amounts from completed transaction records only, in AED. Includes other/uncategorized categories.",
  automotive: "Completed transaction revenue in the Automotive category, in AED.",
  spareParts: "Completed transaction revenue in the Spare Parts category, in AED.",
  other: "Completed transaction revenue outside Automotive and Spare Parts; included in Total.",
  purchases: "Count of completed transaction rows in the selected period.",
  payingUsers: "Distinct transaction user IDs with completed purchases in the selected period.",
  averageValue: "Completed transaction revenue / completed purchase count. Zero purchases yields zero.",
};

export function Definition({ text }: { text: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={text}
          aria-label={`Definition: ${text}`}
          className="analytics-definition"
        >
          <Info size={13} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="analytics-definition-text">{text}</PopoverContent>
    </Popover>
  );
}

export function Panel({
  title,
  note,
  children,
  controls,
}: {
  title: string;
  note?: string;
  children: ReactNode;
  controls?: ReactNode;
}) {
  return (
    <section className="analytics-panel">
      <div className="analytics-heading"><h3 className="text-lg">{title}</h3></div>
      {note && <p className="analytics-note mt-1">{note}</p>}
      {controls}
      {children}
    </section>
  );
}

export function Empty({
  title = "No activity in this period",
  note = "Choose another range or refresh after new activity is collected.",
}: {
  title?: string;
  note?: string;
}) {
  return (
    <div className="analytics-state" role="status">
      <Info size={26} className="text-muted-foreground" aria-hidden="true" />
      <h3>{title}</h3>
      <p className="analytics-note">{note}</p>
    </div>
  );
}

export function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading analytics"
      data-testid="analytics-loading"
      className="analytics-stack"
    >
      <div className="analytics-skeleton" style={{ height: 110 }} />
      <div className="analytics-skeleton" />
      <span className="sr-only">Loading reporting snapshot…</span>
    </div>
  );
}

export function Failure({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div
      className="analytics-panel analytics-state"
      role="alert"
      data-testid="analytics-error"
    >
      <h3>Report could not be loaded</h3>
      <p className="analytics-note">
        {error instanceof Error ? error.message : "The reporting service is unavailable."}
      </p>
      <button className="analytics-chip" onClick={retry} data-testid="analytics-retry">
        Retry report
      </button>
    </div>
  );
}

type KpiKey = keyof ReportMetrics | keyof ReportRevenue;
export interface KpiSpec {
  key: KpiKey;
  label: string;
  format?: "money" | "ratio" | "percent" | "duration";
  rolling?: boolean;
}

function kpiCoverage(
  report: AnalyticsReport,
  item: KpiSpec,
  revenue: boolean,
): [Coverage, Coverage] {
  if (revenue) return ["complete", "complete"];
  const coverage = report.coverage;
  if (item.key === "dau") return [coverage.currentDau, coverage.previousDau];
  if (item.key === "wau") return [coverage.currentWau, coverage.previousWau];
  if (item.rolling) return [coverage.currentRolling, coverage.previousRolling];
  return [coverage.current, coverage.previous];
}

function formatKpi(value: number, format: KpiSpec["format"]) {
  switch (format) {
    case "money": return money(value);
    case "percent": return `${number(value)}%`;
    case "ratio": return value.toFixed(2);
    case "duration": return `${number(value)}s`;
    default: return number(value);
  }
}

function KpiCard({
  report,
  item,
  revenue,
}: {
  report: AnalyticsReport;
  item: KpiSpec;
  revenue: boolean;
}) {
  const current = revenue ? report.revenue.current : report.current;
  const previous = revenue ? report.revenue.previous : report.previous;
  const value = (current as unknown as Record<string, number | null>)[item.key];
  const baseline = (previous as unknown as Record<string, number | null>)[item.key];
  const [coverage, priorCoverage] = kpiCoverage(report, item, revenue);
  const complete = coverage === "complete" && priorCoverage === "complete";
  const unavailable = coverage === "unavailable" || coverage === "future";
  const previousUnavailable = priorCoverage === "unavailable" || priorCoverage === "future";
  const canCompare = complete && value !== null && baseline !== null;
  let delta = "Comparison incomplete";
  let direction = "";

  if (previousUnavailable) {
    delta = "Previous period unavailable";
  } else if (canCompare) {
    if (baseline > 0) {
      delta = `${value >= baseline ? "+" : ""}${number(percentChange(value, baseline)!)}% vs previous`;
      direction = value > baseline ? "up" : value < baseline ? "down" : "";
    } else if (baseline === 0) {
      delta = value > 0 ? "New activity" : "No change · both zero";
      if (value < 0) delta = "No percentage · previous zero";
    } else {
      delta = "No percentage · negative baseline";
    }
  }

  return (
    <div className="analytics-kpi" data-testid={`analytics-kpi-${item.key}`}>
      <div className="analytics-kpi-label">
        {item.label}
        <Definition text={definitions[item.key]} />
      </div>
      <div className="analytics-kpi-value">
        {unavailable || value === null ? "—" : formatKpi(value, item.format)}
      </div>
      <div className="analytics-delta" data-direction={direction}>{delta}</div>
      {coverage === "partial" && (
        <p className="analytics-note">Observed · incomplete coverage</p>
      )}
      {unavailable && (
        <p className="analytics-note">Not collected for this period</p>
      )}
      <p className="analytics-note">
        Previous: {previousUnavailable || baseline === null ? "unavailable" : formatKpi(baseline, item.format)}
        {priorCoverage === "partial" ? " · incomplete" : ""}
      </p>
    </div>
  );
}

export function Kpis({
  report,
  items,
  revenue = false,
}: {
  report: AnalyticsReport;
  items: KpiSpec[];
  revenue?: boolean;
}) {
  return (
    <div className="analytics-kpis">
      {items.map(item => (
        <KpiCard key={item.key} report={report} item={item} revenue={revenue} />
      ))}
    </div>
  );
}

export interface PlotRow {
  time: string;
  comparisonOnly?: boolean;
  end?: string;
  actualStart?: string;
  actualEnd?: string;
  priorTime?: string;
  priorEnd?: string;
  priorActualStart?: string;
  priorActualEnd?: string;
  partial?: boolean;
  coverage?: string;
  rollingCoverage?: string;
  priorRollingCoverage?: string;
  priorPartial?: boolean;
  priorCoverage?: string;
  [key: string]: unknown;
}
export interface PlotMetric {
  key: string;
  label: string;
  color?: string;
  currency?: boolean;
}

function formatPoint(value: unknown, metric: PlotMetric) {
  if (value === null || value === undefined) return "Unavailable";
  return metric.currency ? money(Number(value)) : number(Number(value));
}

function BucketDetails({
  time,
  end,
  actualStart,
  actualEnd,
  partial,
  coverage,
  rollingCoverage,
  prior = false,
}: {
  time?: string;
  end?: string;
  actualStart?: string;
  actualEnd?: string;
  partial?: boolean;
  coverage?: string;
  rollingCoverage?: string;
  prior?: boolean;
}) {
  return (
    <>
      <p className={prior ? "mt-2" : undefined}>
        <strong>{prior ? "Previous: " : ""}{time ? dubai(time) : "No aligned bucket"}</strong>
        {time ? " · Dubai" : ""}
      </p>
      {actualStart && actualEnd && (
        <p className="analytics-note">
          Observed bounds: {dubai(actualStart)} — {dubai(actualEnd)} (end exclusive)
        </p>
      )}
      {!actualStart && end && (
        <p className="analytics-note">Bucket end: {dubai(end)} (exclusive)</p>
      )}
      {time && (partial || coverage !== "complete" || prior) && (
        <p className="analytics-note">
          {partial ? "Partial edge bucket · " : ""}
          {coverage ?? "incomplete"} coverage
        </p>
      )}
      {rollingCoverage && rollingCoverage !== "complete" && (
        <p className="analytics-note">
          {prior ? "Previous rolling-window" : "Rolling-window"} coverage: {rollingCoverage}
        </p>
      )}
    </>
  );
}

function PointDetails({
  row,
  metrics,
  compare,
}: {
  row: PlotRow;
  metrics: PlotMetric[];
  compare: boolean;
}) {
  return (
    <>
      <BucketDetails
        time={row.comparisonOnly ? undefined : row.time}
        end={row.end}
        actualStart={row.actualStart}
        actualEnd={row.actualEnd}
        partial={row.partial}
        coverage={row.coverage}
        rollingCoverage={row.rollingCoverage}
      />
      {metrics.map(metric => (
        <p key={metric.key}>
          {metric.label}: <strong>{formatPoint(row[metric.key], metric)}</strong>
        </p>
      ))}
      {compare && (
        <>
          <BucketDetails
            time={row.priorTime}
            end={row.priorEnd}
            actualStart={row.priorActualStart}
            actualEnd={row.priorActualEnd}
            partial={row.priorPartial}
            coverage={row.priorCoverage}
            rollingCoverage={row.priorRollingCoverage}
            prior
          />
          {row.priorTime && metrics.map(metric => (
            <p key={metric.key}>
              Previous {metric.label}: <strong>{formatPoint(row[`previous_${metric.key}`], metric)}</strong>
            </p>
          ))}
        </>
      )}
    </>
  );
}

export function Trend({
  rows: suppliedRows,
  metrics,
  compare = false,
  hourly = false,
  stacked = false,
  id,
}: {
  rows: PlotRow[];
  metrics: PlotMetric[];
  compare?: boolean;
  hourly?: boolean;
  stacked?: boolean;
  id: string;
}) {
  const rows = compare ? suppliedRows : suppliedRows.filter(point => !point.comparisonOnly);
  const [selected, setSelected] = useState("");
  const row = rows.find(point => point.time === selected);
  const hasData = rows.some(point =>
    metrics.some(metric => typeof point[metric.key] === "number" || (compare && typeof point[`previous_${metric.key}`] === "number")),
  );
  if (!hasData) {
    return (
      <Empty
        title="No collected trend data"
        note="Uncollected history is unavailable, not zero. Try a period with recorded activity."
      />
    );
  }
  const zeroOnly = rows.every(point =>
    metrics.every(metric => point[metric.key] === null || point[metric.key] === undefined || point[metric.key] === 0),
  );
  const common = (
    <>
      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 5" vertical={false} />
      <XAxis
        dataKey="time"
        tickFormatter={value => value.startsWith("previous:") ? "Prior only" : dubai(value, true, hourly)}
        minTickGap={36}
        tickLine={false}
        axisLine={false}
      />
      <YAxis
        width={48}
        allowDecimals={false}
        tickLine={false}
        axisLine={false}
        tickFormatter={value => new Intl.NumberFormat("en-GB", { notation: "compact" }).format(value)}
      />
      <Tooltip
        filterNull={false}
        content={({ active, payload }) =>
          active && payload?.[0]?.payload ? (
            <div className="analytics-tooltip">
              <PointDetails row={payload[0].payload as PlotRow} metrics={metrics} compare={compare} />
            </div>
          ) : null
        }
      />
    </>
  );

  return (
    <div data-testid={`analytics-chart-${id}`}>
      {zeroOnly && (
        <p role="status" className="analytics-note mt-4">
          All observed current-period values are zero.
          Unavailable buckets remain gaps.
        </p>
      )}
      <div
        className="analytics-chart"
        role="img"
        aria-label={`${id} trend. Exact values available in the point selector below.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          {stacked ? (
            <BarChart
              data={rows}
              accessibilityLayer
              margin={{ top: 5, right: 8, left: 0, bottom: 10 }}
              onClick={state => {
                if (state?.activeLabel) setSelected(String(state.activeLabel));
              }}
            >
              {common}
              {metrics.map((metric, index) => (
                <Bar
                  key={metric.key}
                  dataKey={metric.key}
                  name={metric.label}
                  fill={metric.color || colors[index]}
                  stackId="cohorts"
                  isAnimationActive={false}
                />
              ))}
            </BarChart>
          ) : (
            <LineChart
              data={rows}
              accessibilityLayer
              margin={{ top: 5, right: 8, left: 0, bottom: 10 }}
              onClick={state => {
                if (state?.activeLabel) setSelected(String(state.activeLabel));
              }}
            >
              {common}
              {metrics.map((metric, index) => (
                <Line
                  key={metric.key}
                  type="linear"
                  dataKey={metric.key}
                  name={metric.label}
                  stroke={metric.color || colors[index]}
                  strokeWidth={2.5}
                  dot={singleObservedPoint(rows, metric.key) ? { r: 4, fill: metric.color || colors[index] } : false}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
              {compare && metrics.map((metric, index) => (
                <Line
                  key={`previous_${metric.key}`}
                  type="linear"
                  dataKey={`previous_${metric.key}`}
                  name={`Previous ${metric.label}`}
                  stroke={metric.color || colors[index]}
                  strokeDasharray="6 5"
                  strokeWidth={1.8}
                  dot={singleObservedPoint(rows, `previous_${metric.key}`) ? { r: 4, fill: "hsl(var(--card))" } : false}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="analytics-legend">
        {metrics.map((metric, index) => (
          <span key={metric.key}>
            <i style={{ borderColor: metric.color || colors[index] }} />
            {metric.label}
          </span>
        ))}
        {compare && (
          <span><i className="prior" />Previous period (dashed)</span>
        )}
      </div>
      <label className="analytics-note" htmlFor={`point-${id}`}>
        Tap a point or select a bucket for exact values
      </label>
      <select
        id={`point-${id}`}
        className="analytics-point-select"
        value={row ? selected : ""}
        onChange={event => setSelected(event.target.value)}
        data-testid={`analytics-point-${id}`}
      >
        <option value="">Select date/time…</option>
        {rows.map(point => (
          <option key={point.time} value={point.time}>
            {point.comparisonOnly ? `Previous only: ${dubai(point.priorTime!)}` : dubai(point.time)}{point.partial ? " · partial" : ""}
          </option>
        ))}
      </select>
      {row && (
        <div className="analytics-exact" aria-live="polite">
          <PointDetails row={row} metrics={metrics} compare={compare} />
        </div>
      )}
    </div>
  );
}

export function Horizontal({
  rows,
  id,
  currency = false,
}: {
  rows: Array<{ label: string; value: number; share?: number }>;
  id: string;
  currency?: boolean;
}) {
  if (!rows.length || !rows.some(row => row.value !== 0)) return <Empty />;
  const showShare = rows.some(row => row.share !== undefined);
  return (
    <div data-testid={`analytics-chart-${id}`}>
      <div
        className="analytics-chart"
        style={{ height: Math.max(230, rows.length * 35) }}
        role="img"
        aria-label={`${id} breakdown; exact values listed below`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            accessibilityLayer
            margin={{ right: 18, left: 0, bottom: 5 }}
          >
            <CartesianGrid stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" allowDecimals={currency} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              width={110}
              tickLine={false}
              axisLine={false}
              tickFormatter={value => value.length > 18 ? `${value.slice(0, 17)}…` : value}
            />
            <Tooltip
              formatter={value => currency ? money(Number(value)) : number(Number(value))}
              contentStyle={{
                background: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: 8,
                color: "hsl(var(--foreground))",
              }}
            />
            <Bar
              dataKey="value"
              maxBarSize={32}
              name={currency ? "Revenue" : "Count"}
              fill={colors[0]}
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="analytics-table-wrap">
        <table className="analytics-table">
          <caption className="sr-only">{id} exact values</caption>
          <thead>
            <tr>
              <th>Breakdown</th>
              <th>{currency ? "Revenue (AED)" : "Count"}</th>
              {showShare && <th>Share</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.label}-${index}`}>
                <td>{row.label}</td>
                <td>{currency ? money(row.value) : number(row.value)}</td>
                {showShare && <td>{row.share === undefined ? "—" : `${number(row.share)}%`}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
