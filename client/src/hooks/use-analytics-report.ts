import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/lib/queryClient";
import type { AnalyticsReport, ReportContext, ReportFilters, ScreenReport } from "@shared/analytics-reporting";

async function getReport<T>(path: string, params: Record<string, string | undefined>, signal?: AbortSignal): Promise<T> {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => { if (value) search.set(key, value); });
  const response = await fetch(`/api/admin/analytics/${path}?${search}`, {
    credentials: "include", headers: getAuthHeaders(), signal,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Analytics request failed (${response.status})`);
  }
  return response.json();
}
export function useAnalyticsReport(filters: ReportFilters, refreshKey: number) {
  return useQuery<AnalyticsReport>({
    queryKey: ["admin-analytics-report", filters, refreshKey],
    queryFn: ({ signal }) => getReport("report", { ...filters }, signal),
    staleTime: 60000, gcTime: 300000, retry: false, refetchOnWindowFocus: false,
  });
}
export function useScreenReport(context: ReportContext | undefined, screen: string | undefined) {
  return useQuery<ScreenReport>({
    queryKey: ["admin-analytics-screen", context, screen],
    enabled: !!context && screen !== undefined,
    queryFn: ({ signal }) => getReport("screens/timeseries", {
      preset: context!.preset, startDate: context!.startDate, endDate: context!.endDate,
      interval: context!.interval, asOf: context!.asOf, screen,
    }, signal),
    staleTime: 60000, gcTime: 300000, retry: false, refetchOnWindowFocus: false, refetchOnMount: false,
  });
}
