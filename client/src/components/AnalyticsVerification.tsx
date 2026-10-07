import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AnalyticsSummary } from "@shared/analytics";

const shortId = (id: string | null) => id ? `${id.slice(0, 8)}…` : "Anonymous";
const dubaiTime = (value: string) => new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Dubai", day: "2-digit", month: "short",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
}).format(new Date(value));

export function AnalyticsVerification() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/admin/analytics/verification"], staleTime: 15000,
  });
  const metrics = data ? [
    ["App Opens", data.appOpens], ["Sessions", data.sessions],
    ["Unique Visitors", data.uniqueVisitors], ["Unique Signed-in Users", data.uniqueSignedInUsers],
    ["New Anonymous Visitors", data.newAnonymousVisitors], ["Returning Anonymous Visitors", data.returningAnonymousVisitors],
  ] as const : [];
  return (
    <Card data-testid="analytics-verification">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">First-party analytics · verification</CardTitle>
          <p className="text-xs text-muted-foreground mt-2">
            Today, midnight to now · Asia/Dubai (UTC+4). Separate from legacy Stats above.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>Refresh</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <p role="status" className="text-sm text-muted-foreground">Loading analytics…</p>}
        {isError && <p role="alert" className="text-sm text-destructive">Could not load analytics. Try Refresh.</p>}
        {data && <>
          <dl className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {metrics.map(([label, value]) => <div key={label} className="rounded-lg border p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-xl font-semibold mt-1" data-testid={`analytics-${label.toLowerCase().replaceAll(" ", "-")}`}>{value.toLocaleString()}</dd>
            </div>)}
          </dl>
          <p className="text-xs text-muted-foreground">
            Sessions = sessions started today. Visitors = distinct anonymous IDs, not guaranteed distinct people.
            Signed-in users = distinct verified accounts; never added to visitors.
            New visitors were first observed today; returning visitors were first observed before today.
          </p>
          <div className="flex flex-wrap gap-4 text-sm">
            <strong>Event counts:</strong>
            <span>iOS: {data.platforms.ios}</span><span>Android: {data.platforms.android}</span><span>Web: {data.platforms.web}</span>
          </div>
          <details>
            <summary className="cursor-pointer text-sm font-medium py-2">Recent Events ({data.recentEvents.length})</summary>
            {!data.recentEvents.length ? <p className="text-sm text-muted-foreground py-3">No analytics events collected yet.</p> :
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead><tr className="border-b">{["Dubai time", "Event / screen", "Platform / version", "Visitor", "Session", "Account"].map(h =>
                    <th key={h} className="p-2 font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{data.recentEvents.map(event => <tr key={event.id} className="border-b">
                    <td className="p-2 whitespace-nowrap">{dubaiTime(event.timestamp)}</td>
                    <td className="p-2">{event.eventName}<br /><span className="text-muted-foreground">{event.screen || "—"}</span></td>
                    <td className="p-2">{event.platform}<br />{event.appVersion || "Not available"}{event.appBuild ? ` (${event.appBuild})` : ""}</td>
                    <td className="p-2 font-mono" title={event.anonymousId}>{shortId(event.anonymousId)}</td>
                    <td className="p-2 font-mono" title={event.sessionId}>{shortId(event.sessionId)}</td>
                    <td className="p-2 font-mono">{shortId(event.userId)}</td>
                  </tr>)}</tbody>
                </table>
              </div>}
          </details>
          <p className="text-xs text-muted-foreground">Updated {dubaiTime(data.end)}. Recent events show the latest 25 across all days. No heartbeat events.</p>
        </>}
      </CardContent>
    </Card>
  );
}
