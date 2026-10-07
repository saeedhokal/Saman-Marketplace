import { useEffect } from "react";
import { useLocation } from "wouter";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { analytics, startAnalytics, stopAnalytics } from "@/lib/analytics";
import { screenForPath } from "@shared/analytics";

export function AnalyticsTracker() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();
  const { hasSelectedLanguage } = useLanguage();
  useEffect(() => {
    if (!isLoading) analytics.identify(user?.id ?? null);
  }, [user?.id, isLoading]);
  useEffect(() => { startAnalytics(); return stopAnalytics; }, []);
  useEffect(() => {
    if (Capacitor.isNativePlatform() && !hasSelectedLanguage) return;
    // Debounce redirects. Auth owns its mode changes on the same pathname.
    const timer = setTimeout(() => {
      if (location.split("?")[0] === "/auth") return;
      const mapped = screenForPath(location);
      if (mapped) analytics.screen(mapped.screen, { pathname: mapped.pathname as any }, location.split(/[?#]/)[0]);
      else analytics.leaveScreen();
    }, 100);
    return () => clearTimeout(timer);
  }, [location, hasSelectedLanguage]);
  return null;
}
