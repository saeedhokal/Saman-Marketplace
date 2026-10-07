import { useState, type FormEvent } from "react";
import { RefreshCw } from "lucide-react";
import { useAnalyticsReport, useScreenReport } from "@/hooks/use-analytics-report";
import type {
  AnalyticsReport,
  ReportFilters,
  ReportPoint,
  ReportPreset,
  PlatformCounts,
} from "@shared/analytics-reporting";
import { VISITOR_EXPLANATION } from "@shared/analytics-reporting";
import { alignBuckets } from "./alignment";
import {
  Definition,
  Empty,
  Failure,
  Horizontal,
  Kpis,
  Loading,
  Panel,
  Trend,
  colors,
  dubai,
  money,
  number,
  screenName,
  type KpiSpec,
  type PlotMetric,
  type PlotRow,
} from "./report-ui";
import "./analytics.css";

type View = "overview" | "users" | "activity" | "screens" | "revenue";
const tabs: Array<{ key: View; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "activity", label: "App Activity" },
  { key: "screens", label: "Screens" },
  { key: "revenue", label: "Revenue" },
];
const presets: Array<{ key: ReportPreset; label: string }> = [
  { key: "today", label: "Today" },
  { key: "24h", label: "Last 24 Hours" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 90 Days" },
  { key: "12m", label: "Last 12 Months" },
  { key: "custom", label: "Custom Range" },
];
const activityMetrics: PlotMetric[] = [
  { key: "appOpens", label: "App Opens" },
  { key: "sessions", label: "Sessions" },
  { key: "visitors", label: "Visitors" },
  { key: "signedInUsers", label: "Signed-in Users" },
  { key: "screenViews", label: "Screen Views" },
];
const revenueMetrics: PlotMetric[] = [
  { key: "revenue", label: "Total", currency: true },
  { key: "automotiveRevenue", label: "Automotive", currency: true },
  { key: "sparePartsRevenue", label: "Spare Parts", currency: true },
];
const overviewKpis: KpiSpec[] = [
  { key: "appOpens", label: "App Opens" },
  { key: "visitors", label: "Unique Visitors" },
  { key: "sessions", label: "Sessions" },
  { key: "signedInUsers", label: "Signed-in Users" },
  { key: "newVisitors", label: "New Visitors" },
  { key: "returningVisitors", label: "Returning Visitors" },
  { key: "screenViews", label: "Screen Views" },
  { key: "sessionsPerVisitor", label: "Sessions per Visitor", format: "ratio" },
];
const userKpis: KpiSpec[] = [
  { key: "visitors", label: "Active Visitors" },
  { key: "signedInUsers", label: "Signed-in Active Users" },
  { key: "newVisitors", label: "New Visitors" },
  { key: "returningVisitors", label: "Returning Visitors" },
  { key: "dau", label: "DAU", rolling: true },
  { key: "wau", label: "WAU", rolling: true },
  { key: "mau", label: "MAU", rolling: true },
  { key: "stickiness", label: "DAU / MAU Stickiness", format: "percent", rolling: true },
  { key: "sessionsPerVisitor", label: "Sessions per Visitor", format: "ratio" },
];
const revenueKpis: KpiSpec[] = [
  { key: "total", label: "Total Revenue", format: "money" },
  { key: "automotive", label: "Automotive Revenue", format: "money" },
  { key: "spareParts", label: "Spare Parts Revenue", format: "money" },
  { key: "purchases", label: "Completed Purchases" },
  { key: "payingUsers", label: "Unique Paying Users" },
  { key: "averageValue", label: "Average Transaction Value", format: "money" },
];

interface ComparisonProps {
  report: AnalyticsReport;
  compare: boolean;
}
interface MetricSelectionProps extends ComparisonProps {
  selected: string[];
  setSelected: (value: string[]) => void;
}

/** Presentation-only mapping of server buckets. Distinct counts are never summed. */
function plotRows(report: AnalyticsReport, metrics: PlotMetric[]): PlotRow[] {
  return alignBuckets(report.series.current, report.series.previous).map(({ point, prior, row: aligned }) => {
    const rolling = metrics.some(metric => ["dau", "wau", "mau"].includes(metric.key));
    const row: PlotRow = {
      ...aligned,
      rollingCoverage: rolling ? point?.rollingCoverage : undefined,
      priorRollingCoverage: rolling ? prior?.rollingCoverage : undefined,
    };
    metrics.forEach(metric => {
      row[metric.key] = point?.[metric.key as keyof ReportPoint] ?? null;
      row[`previous_${metric.key}`] = prior?.[metric.key as keyof ReportPoint] ?? null;
    });
    return row;
  });
}
function MetricSwitches({
  options,
  selected,
  setSelected,
  id,
}: {
  options: PlotMetric[];
  selected: string[];
  setSelected: (value: string[]) => void;
  id: string;
}) {
  function toggle(key: string) {
    if (!selected.includes(key)) {
      setSelected([...selected, key]);
    } else if (selected.length > 1) {
      setSelected(selected.filter(value => value !== key));
    }
  }
  return (
    <div className="analytics-controls" role="group" aria-label={`${id} metrics`}>
      {options.map((option, index) => (
        <button
          key={option.key}
          className="analytics-chip"
          aria-pressed={selected.includes(option.key)}
          onClick={() => toggle(option.key)}
          data-testid={`analytics-metric-${id}-${option.key}`}
        >
          <span style={{ color: colors[index] }}>{selected.includes(option.key) ? "● " : ""}</span>
          {option.label}
        </button>
      ))}
      <span className="analytics-note">Select one or overlay several</span>
    </div>
  );
}
function ActivityTrend({ report, compare, selected, setSelected }: MetricSelectionProps) {
  const metrics = activityMetrics
    .filter(metric => selected.includes(metric.key))
    .map(metric => ({ ...metric, color: colors[activityMetrics.indexOf(metric)] }));
  return (
    <Panel
      title="Activity trend"
      note="Actual tracked activity. Visitors are distinct within each bucket and cannot be summed to obtain period totals."
      controls={
        <MetricSwitches options={activityMetrics} selected={selected} setSelected={setSelected} id="activity" />
      }
    >
      <Trend
        id="activity"
        rows={plotRows(report, metrics)}
        metrics={metrics}
        compare={compare}
        hourly={report.context.interval === "hour"}
      />
    </Panel>
  );
}
function Cohorts({ report }: { report: AnalyticsReport }) {
  const total = report.current.visitors;
  const unavailable = report.coverage.current === "unavailable" || report.coverage.current === "future";
  const split = unavailable
    ? "Visitor split unavailable."
    : total
      ? `${number(report.current.newVisitors / total * 100)}% new · ${number(report.current.returningVisitors / total * 100)}% returning (period distinct totals)${report.coverage.current === "partial" ? " · observed, incomplete coverage" : ""}`
      : "No observed visitors in this period.";
  const metrics = [
    { key: "newVisitors", label: "New this period", color: colors[0] },
    { key: "returningVisitors", label: "Pre-existing", color: colors[1] },
  ];
  return (
    <Panel title="New vs returning visitors" note={split}>
      <Trend
        id="cohorts"
        rows={plotRows(report, metrics)}
        metrics={metrics}
        stacked
        hourly={report.context.interval === "hour"}
      />
      <p className="analytics-note mt-3">
        Cohorts are fixed for the selected range using first-seen time, not signup date.
        Identities can repeat across buckets; percentages use range totals, never summed buckets.
        {" "}<Definition text={VISITOR_EXPLANATION} />
      </p>
    </Panel>
  );
}
function ActiveUsers({ report, compare }: ComparisonProps) {
  const metrics = [
    { key: "dau", label: "DAU", color: colors[0] },
    { key: "wau", label: "WAU", color: colors[1] },
    { key: "mau", label: "MAU", color: colors[2] },
  ];
  return (
    <Panel
      title="DAU / WAU / MAU"
      note={`Cards anchored to ${dubai(report.context.end)} Dubai. Trend windows end at each bucket's as-of time.`}
    >
      <Trend
        id="rolling-users"
        rows={plotRows(report, metrics)}
        metrics={metrics}
        compare={compare}
        hourly={report.context.interval === "hour"}
      />
      <p className="analytics-note mt-3">
        DAU: relevant Dubai calendar day. WAU: trailing 7 days. MAU: trailing 30 days.
        These are distinct counts, not sums of daily users. Rolling history may be
        incomplete even when the visible range is fully collected.
        {" "}<Definition text={VISITOR_EXPLANATION} />
      </p>
    </Panel>
  );
}
function Platforms({ report, compare }: ComparisonProps) {
  const [metric, setMetric] = useState<keyof PlatformCounts>("visitors");
  if (report.coverage.current === "unavailable" || report.coverage.current === "future") {
    return (
      <Panel title="Platforms">
        <Empty
          title="Platform activity unavailable"
          note="This range has no collected analytics coverage. Platform shares cannot be inferred from missing history."
        />
      </Panel>
    );
  }
  const label = metric === "visitors" ? "Unique Visitors" : metric === "sessions" ? "Sessions" : "App Opens";
  const shareKey = metric === "visitors" ? "visitorShare" : metric === "sessions" ? "sessionShare" : "appOpenShare";
  const name = { ios: "iOS", android: "Android", web: "Web" };
  const metrics = report.platforms.map((p, index) => ({ key: p.platform, label: name[p.platform], color: colors[index] }));
  const rows = alignBuckets(report.series.current, report.series.previous).map(({ point, prior, row: aligned }) => {
    const row: PlotRow = { ...aligned };
    metrics.forEach(platformMetric => {
      const platform = platformMetric.key as keyof ReportPoint["platforms"];
      row[platform] = point?.platforms[platform][metric] ?? null;
      row[`previous_${platform}`] = prior?.platforms[platform][metric] ?? null;
    });
    return row;
  });
  return (
    <div className="analytics-stack">
      <Panel
        title="Platform breakdown"
        note={metric === "visitors"
          ? "Visitor shares use summed platform-identity counts as the denominator; one identity can appear on multiple platforms."
          : `${label} shares use the sum of recorded platform ${label.toLowerCase()} as the denominator.`}
        controls={
          <div className="analytics-controls" role="group" aria-label="Platform metric">
            {(["visitors", "sessions", "appOpens"] as const).map(key => (
              <button
                className="analytics-chip"
                key={key}
                aria-pressed={metric === key}
                onClick={() => setMetric(key)}
                data-testid={`analytics-platform-${key}`}
              >
                {key === "visitors" ? "Unique Visitors" : key === "sessions" ? "Sessions" : "App Opens"}
              </button>
            ))}
          </div>
        }
      >
        <Horizontal
          id="platforms"
          rows={report.platforms.map(platform => ({
            label: name[platform.platform],
            value: platform[metric],
            share: platform[shareKey],
          }))}
        />
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <caption className="sr-only">All platform metrics</caption>
            <thead>
              <tr>
                <th>Platform</th>
                <th>App Opens / share</th>
                <th>Sessions / share</th>
                <th>Visitors / share</th>
              </tr>
            </thead>
            <tbody>
              {report.platforms.map(platform => (
                <tr key={platform.platform}>
                  <td>{name[platform.platform]}</td>
                  <td>{number(platform.appOpens)} / {number(platform.appOpenShare)}%</td>
                  <td>{number(platform.sessions)} / {number(platform.sessionShare)}%</td>
                  <td>{number(platform.visitors)} / {number(platform.visitorShare)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Panel
        title={`Platform trend · ${label}`}
        note="Uses the recorded platform field. Platform distinct populations may overlap."
      >
        <Trend
          id="platform-trend"
          metrics={metrics}
          rows={rows}
          compare={compare}
          hourly={report.context.interval === "hour"}
        />
      </Panel>
    </div>
  );
}
function Versions({ report }: { report: AnalyticsReport }) {
  if (report.coverage.current === "unavailable" || report.coverage.current === "future") {
    return (
      <Panel title="Native version adoption">
        <Empty
          title="Version adoption unavailable"
          note="Choose a period with collected native analytics. Missing history is not zero adoption."
        />
      </Panel>
    );
  }
  return (
    <Panel
      title="Native version adoption"
      note={`Latest observed version per (platform, analytics identity) in this period. Denominator: ${number(report.versionTotal)} active native identities.`}
    >
      <Horizontal
        id="versions"
        rows={report.versions.map(version => ({
          label: `${version.platform === "ios" ? "iOS" : "Android"} ${version.version ?? "Unknown version"} · ${version.build === null ? "unknown build" : `build ${version.build}`}`,
          value: version.visitors,
          share: version.share,
        }))}
      />
      <p className="analytics-note mt-3">
        Web version is not applicable. Missing native version/build is shown explicitly.
        Shares use the server's native-identity denominator, not global visitors.
        {report.versionsTruncated
          ? " Smaller versions are grouped in the server-provided Other row; its count and share are included in the denominator."
          : ""}
      </p>
    </Panel>
  );
}
function RevenueTrend({ report, compare, selected, setSelected }: MetricSelectionProps) {
  const metrics = revenueMetrics.filter(m => selected.includes(m.key)).map(m => ({ ...m, color: colors[revenueMetrics.indexOf(m)] }));
  const rows = plotRows(report, metrics).map(row => ({
    ...row,
    coverage: row.coverage === "future" ? "future" : "complete",
    priorCoverage: row.priorCoverage === "future" ? "future" : row.priorTime ? "complete" : undefined,
    rollingCoverage: undefined,
    priorRollingCoverage: undefined,
  }));
  return (
    <Panel
      title="Revenue over time"
      note="AED · completed transactions only. Independent of analytics collection coverage."
      controls={<MetricSwitches options={revenueMetrics} selected={selected} setSelected={setSelected} id="revenue" />}
    >
      <Trend id="revenue" rows={rows} metrics={metrics} compare={compare} hourly={report.context.interval === "hour"} />
      <p className="analytics-note mt-3">
        Total includes all completed categories. Other / uncategorized revenue: {money(report.revenue.current.other)}.
        Transaction timestamps follow UTC storage, displayed and grouped in Dubai time.
        No VAT or package price recalculation. Future buckets are unavailable, not zero.
      </p>
    </Panel>
  );
}
function ScreenRanking({ report, selected, select }: { report: AnalyticsReport; selected?: string; select?: (screen: string) => void }) {
  if (report.coverage.current === "unavailable" || report.coverage.current === "future") {
    return (
      <Panel title="Top screens">
        <Empty
          title="Screen activity unavailable"
          note="Recorded screen-view coverage is unavailable for this range. Earlier screen names and counts cannot be reconstructed."
        />
      </Panel>
    );
  }
  const chartScreens = report.screens.slice(0, 12);
  const tableScreens = report.screens.slice(0, 100);
  return (
    <Panel
      title="Top screens"
      note={`Chart: top ${chartScreens.length} of ${number(report.screenCount)} recorded screens, ranked by views. Unknown names are retained.`}
    >
      <Horizontal
        id="screens"
        rows={chartScreens.map(s => ({ label: screenName(s.screen), value: s.views, share: s.share }))}
      />
      {tableScreens.length > 0 && (
        <div className="analytics-table-wrap">
          <table className="analytics-table" data-testid="analytics-screen-table">
            <caption className="sr-only">
              Screen rankings{select ? " · select a screen to see its trend" : ""}
            </caption>
            <thead>
              <tr><th>Screen</th><th>Views</th><th>Unique Visitors</th><th>% of Screen Views</th></tr>
            </thead>
            <tbody>
              {tableScreens.map(s => (
                <tr key={s.screen} data-selected={selected === s.screen}>
                  <td>
                    {select ? (
                      <button
                        onClick={() => select(s.screen)}
                        className="text-accent font-semibold text-left py-1"
                        aria-pressed={selected === s.screen}
                        data-testid={`analytics-screen-${s.screen}`}
                      >
                        {screenName(s.screen)}
                      </button>
                    ) : screenName(s.screen)}
                  </td>
                  <td>{number(s.views)}</td>
                  <td>{number(s.visitors)}</td>
                  <td>{number(s.share)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="analytics-note mt-3" data-testid="analytics-screen-limits">
        Table: {tableScreens.length} of {number(report.screenCount)} screens (maximum 100).
        {report.screensTruncated && " Rankings are truncated to the server's top 100 screens; additional recorded screens are not shown."}
        {" "}Share denominator: all screen views in the selected range, including screens outside the ranking.
        Visitors are distinct per screen and may overlap.
      </p>
    </Panel>
  );
}
function ScreensView({
  report,
  compare,
  selected,
  setSelected,
}: ComparisonProps & {
  selected: string | undefined;
  setSelected: (screen: string) => void;
}) {
  // This component is mounted only in Screens: no hidden drill-down requests.
  const query = useScreenReport(report.context, selected);
  const metrics = [{ key: "views", label: "Screen Views", color: colors[0] }];
  const rows: PlotRow[] = query.data ? alignBuckets(query.data.current, query.data.previous).map(({ point, prior, row }) => {
    return {
      ...row,
      views: point?.views ?? null,
      previous_views: prior?.views ?? null,
    };
  }) : [];
  return (
    <div className="analytics-stack">
      <Kpis report={report} items={[{ key: "screenViews", label: "Screen Views" }]} />
      <ScreenRanking report={report} selected={selected} select={setSelected} />
      <Panel
        title={selected === undefined ? "Screen views over time" : `Screen views · ${screenName(selected)}`}
        note="Select a recorded screen above. This drill-down uses the same frozen report context."
      >
        {selected === undefined ? (
          <Empty title="Choose a screen" note="Select a screen from the ranking to inspect its views over time." />
        ) : query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <Failure error={query.error} retry={() => { void query.refetch(); }} />
        ) : (
          <Trend
            id="screen-detail"
            rows={rows}
            metrics={metrics}
            compare={compare}
            hourly={report.context.interval === "hour"}
          />
        )}
      </Panel>
    </div>
  );
}

function ReportContextNote({ report }: { report: AnalyticsReport }) {
  const context = report.context;
  return (
    <div className="analytics-note mt-4" data-testid="analytics-context">
      <p>
        <strong>Selected range:</strong> {dubai(context.start)} — {dubai(context.end)}
        {" · "}{context.interval} buckets
      </p>
      <p><strong>Snapshot as of:</strong> {dubai(context.asOf)} Dubai · {context.comparisonLabel}</p>
      <p>Previous: {dubai(context.previousStart)} — {dubai(context.previousEnd)}</p>
      {context.partialPeriod && (
        <p>
          Partial current period: values are observed through the selected endpoint.
          {context.preset === "today"
            ? " Today compares this partial Dubai day with the full previous Dubai day."
            : " The comparison uses the preceding equivalent elapsed window."}
          {" "}Percentage changes are shown only when both periods have complete data coverage.
        </p>
      )}
      <p>
        Today starts at Dubai midnight; Last 24 Hours is rolling.
        Other presets use elapsed-day or calendar-month windows.
        Partial edge buckets are marked in exact-value tooltips.
      </p>
    </div>
  );
}

function CoverageNote({ report }: { report: AnalyticsReport }) {
  const coverage = report.coverage;
  if (coverage.current === "complete" && coverage.previous === "complete") return null;
  return (
    <div className="analytics-coverage analytics-note" data-testid="analytics-coverage">
      {coverage.collectionStartedAt ? (
        <p>
          Detailed analytics collection began on {dubai(coverage.collectionStartedAt)}.
          Earlier activity is unavailable for these metrics.
        </p>
      ) : (
        <p>
          Detailed analytics have not yet been collected. Activity values are unavailable,
          not zero. Completed-transaction revenue remains independent.
        </p>
      )}
      <p>
        Current coverage: {coverage.current}. Previous: {coverage.previous}.
        DAU: {coverage.currentDau} / previous {coverage.previousDau}.
        WAU: {coverage.currentWau} / previous {coverage.previousWau}.
        MAU: {coverage.currentRolling} / previous {coverage.previousRolling}.
        Basis: {coverage.basis}.
      </p>
      <p>No percentage change is inferred from incomplete or unavailable data coverage.</p>
    </div>
  );
}

function UsersView({ report, compare }: { report: AnalyticsReport; compare: boolean }) {
  const metrics = [
    { key: "visitors", label: "Active Visitors" },
    { key: "newVisitors", label: "New this period" },
    { key: "returningVisitors", label: "Pre-existing" },
  ];
  return (
    <>
      <Kpis report={report} items={userKpis} />
      <Panel
        title="Active, new & returning visitor trend"
        note="Selected-period cohorts stay fixed across the plotted buckets. Distinct identities are not guaranteed to be unique physical people."
      >
        <Trend
          id="users"
          rows={plotRows(report, metrics)}
          metrics={metrics}
          compare={compare}
          hourly={report.context.interval === "hour"}
        />
      </Panel>
      <Cohorts report={report} />
      <ActiveUsers report={report} compare={compare} />
    </>
  );
}

function ActivityView({ report, compare }: { report: AnalyticsReport; compare: boolean }) {
  const metrics = activityMetrics.slice(0, 2);
  const unavailable = ["unavailable", "future"].includes(report.coverage.current);
  return (
    <>
      <Kpis
        report={report}
        items={[
          { key: "appOpens", label: "App Opens" },
          { key: "sessions", label: "Sessions" },
          { key: "sessionsPerVisitor", label: "Sessions per Visitor", format: "ratio" },
          { key: "avgSessionSeconds", label: "Average Session Duration", format: "duration" },
        ]}
      />
      <Panel
        title="App Opens vs Sessions"
        note="Foreground/open events and sessions started in the selected period; these are different measures."
      >
        <Trend
          id="opens-sessions"
          rows={plotRows(report, metrics)}
          metrics={metrics}
          compare={compare}
          hourly={report.context.interval === "hour"}
        />
      </Panel>
      <Panel
        title="Observed session duration"
        note={unavailable ? "Duration coverage is unavailable for this period." : `${number(report.current.completedSessions)} eligible inactive/completed sessions. Duration is last activity minus session start, not now minus start.`}
      >
        {unavailable ? (
          <Empty title="Session duration unavailable" note="Missing collection history cannot be interpreted as zero completed sessions." />
        ) : (
          <Horizontal id="duration" rows={report.duration.map(bin => ({ label: bin.label, value: bin.sessions }))} />
        )}
        <p className="analytics-note mt-3">
          Non-overlapping bins: under 30s; 30s–under 2m; 2–under 5m;
          5–under 10m; 10–under 30m; 30m+. Ongoing, future, inverted and invalid
          sessions are excluded. Sessions must have been inactive at least 30 minutes
          at the report as-of endpoint. Long observed sessions are not capped;
          recorded activity is not continuous attention.
        </p>
      </Panel>
      <Platforms report={report} compare={compare} />
      <Versions report={report} />
    </>
  );
}

function RevenueSplit({ report }: { report: AnalyticsReport }) {
  return (
    <Panel
      title="Completed revenue by category"
      note="Category split preserves all completed revenue, including the other/uncategorized residual."
    >
      <Horizontal
        id="revenue-split"
        currency
        rows={[
          { label: "Automotive", value: report.revenue.current.automotive },
          { label: "Spare Parts", value: report.revenue.current.spareParts },
          { label: "Other / uncategorized", value: report.revenue.current.other },
        ]}
      />
    </Panel>
  );
}

// Outer Admin Stats TabsContent does not forceMount: every fresh opening mounts
// this component with defaults. Internal analytics tabs keep this component and
// its single combined-report query mounted, with an unchanged filter/query key.
export default function AnalyticsDashboard() {
  const [view, setView] = useState<View>("overview");
  const [filters, setFilters] = useState<ReportFilters>({ preset: "7d" });
  const [preset, setPreset] = useState<ReportPreset>("7d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [compare, setCompare] = useState(false);
  const [activitySelected, setActivitySelected] = useState(["appOpens"]);
  const [revenueSelected, setRevenueSelected] = useState(["revenue"]);
  const [screen, setScreen] = useState<string>();
  const query = useAnalyticsReport(filters, refreshKey);
  const report = query.data;
  function choosePreset(value: ReportPreset) {
    setPreset(value); setFormError("");
    if (value !== "custom") { setFilters({ preset: value }); setScreen(undefined); }
  }
  function applyCustom(event: FormEvent) {
    event.preventDefault();
    if (!startDate || !endDate) { setFormError("Select both Dubai calendar dates."); return; }
    if (startDate > endDate) { setFormError("End date must be on or after start date."); return; }
    setFilters({ preset: "custom", startDate, endDate }); setScreen(undefined); setFormError("");
  }
  return (
    <div className="saman-analytics" data-testid="admin-analytics">
      <div className="analytics-panel">
        <div className="analytics-heading">
          <div>
            <p className="analytics-kicker">Saman · owner reporting</p>
            <h2>Usage & revenue</h2>
            <p className="analytics-note mt-2">One reporting period. All times Asia/Dubai (UTC+4).</p>
          </div>
          <button
            className="analytics-chip flex items-center gap-2"
            disabled={query.isFetching}
            onClick={() => setRefreshKey(value => value + 1)}
            data-testid="analytics-refresh"
          >
            <RefreshCw size={14} aria-hidden="true" />
            {query.isFetching ? "Loading snapshot…" : "Refresh report"}
          </button>
        </div>
        <div className="analytics-controls" aria-label="Global reporting period" role="group" data-testid="stats-period-selector">
          {presets.map(p => (
            <button className="analytics-chip" key={p.key} aria-pressed={preset === p.key} onClick={() => choosePreset(p.key)} data-testid={`analytics-range-${p.key}`}>
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <form className="analytics-date-form" onSubmit={applyCustom} data-testid="analytics-custom-form">
            <label>
              Start date · Dubai
              <input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} data-testid="analytics-start-date" />
            </label>
            <label>
              End date · inclusive
              <input type="date" required value={endDate} onChange={e => setEndDate(e.target.value)} data-testid="analytics-end-date" />
            </label>
            <button className="analytics-chip" type="submit" data-testid="analytics-apply-range">Apply range</button>
            <p className="analytics-note w-full">
              Both selected dates are included. The end boundary is next Dubai midnight,
              capped at the reporting as-of time for today. Unsupported or excessive ranges
              are rejected by the server. Until Apply, the existing report period remains active.
            </p>
            {formError && <p role="alert" className="text-destructive text-xs">{formError}</p>}
          </form>
        )}
        <div className="analytics-controls">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={compare} onChange={event => setCompare(event.target.checked)} className="accent-orange-600 h-4 w-4" data-testid="analytics-compare" />
            Compare previous period
          </label>
          <span className="analytics-note">Dashed prior lines · aligned by relative bucket, with actual prior dates</span>
        </div>
        {report && <ReportContextNote report={report} />}
      </div>
      <div className="analytics-tabs" role="tablist" aria-label="Analytics sections">
        {tabs.map(tab => (
          <button role="tab" id={`analytics-tab-${tab.key}`} aria-selected={view === tab.key} aria-controls="analytics-tabpanel" key={tab.key} onClick={() => setView(tab.key)} data-testid={`analytics-tab-${tab.key}`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div id="analytics-tabpanel" role="tabpanel" aria-labelledby={`analytics-tab-${view}`} className="analytics-stack">
        {query.isPending ? (
          <Loading />
        ) : query.isError ? (
          <Failure error={query.error} retry={() => { void query.refetch(); }} />
        ) : report ? (
          <>
            <CoverageNote report={report} />
            {view === "overview" && (
              <>
                <Kpis report={report} items={overviewKpis.slice(0, 4)} />
                <ActivityTrend report={report} compare={compare} selected={activitySelected} setSelected={setActivitySelected} />
                <Kpis report={report} items={overviewKpis.slice(4)} />
                <Cohorts report={report} />
                <Platforms report={report} compare={compare} />
                <ActiveUsers report={report} compare={compare} />
                <div className="analytics-pair">
                  <ScreenRanking report={report} />
                  <Versions report={report} />
                </div>
                <RevenueTrend report={report} compare={compare} selected={revenueSelected} setSelected={setRevenueSelected} />
              </>
            )}
            {view === "users" && <UsersView report={report} compare={compare} />}
            {view === "activity" && <ActivityView report={report} compare={compare} />}
            {view === "screens" && <ScreensView report={report} compare={compare} selected={screen} setSelected={setScreen} />}
            {view === "revenue" && (
              <>
                <Kpis report={report} items={revenueKpis} revenue />
                <RevenueTrend report={report} compare={compare} selected={revenueSelected} setSelected={setRevenueSelected} />
                <RevenueSplit report={report} />
                <p className="analytics-note">
                  Read-only report of completed transaction records. The separate Admin
                  Revenue section and payment/accounting flows are unchanged.
                </p>
              </>
            )}
          </>
        ) : (
          <Empty title="No reporting snapshot returned" />
        )}
      </div>
    </div>
  );
}
