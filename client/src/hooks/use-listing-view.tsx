import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";

export type WebView = "large" | "default" | "compact";
export type MobileView = "single" | "default" | "compact";
export type ListingView = WebView | MobileView;
export type Density = "large" | "default" | "compact" | "single";

const STORAGE_KEY_WEB = "saman_listing_view_web";
const STORAGE_KEY_MOBILE = "saman_listing_view_mobile";

function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function readStored(key: string, fallback: ListingView): ListingView {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    if (v === "large" || v === "default" || v === "compact" || v === "single") {
      return v;
    }
  } catch {}
  return fallback;
}

// Module-level singleton store so every component that calls useListingView()
// stays in sync within the same tab (the `storage` event does NOT fire in the
// tab that wrote the value, so we need our own subscription mechanism).
const NATIVE = isNative();
const STORAGE_KEY = NATIVE ? STORAGE_KEY_MOBILE : STORAGE_KEY_WEB;
let currentView: ListingView = readStored(STORAGE_KEY, "default");
const subscribers = new Set<(v: ListingView) => void>();

function setGlobalView(v: ListingView) {
  if (currentView === v) return;
  currentView = v;
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {}
  subscribers.forEach((cb) => cb(v));
}

if (typeof window !== "undefined") {
  // Cross-tab updates: still respect storage events from other tabs.
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    if (
      e.newValue === "large" ||
      e.newValue === "default" ||
      e.newValue === "compact" ||
      e.newValue === "single"
    ) {
      if (currentView !== e.newValue) {
        currentView = e.newValue;
        subscribers.forEach((cb) => cb(currentView));
      }
    }
  });
}

export function useListingView() {
  const [view, setViewState] = useState<ListingView>(currentView);

  useEffect(() => {
    const cb = (v: ListingView) => setViewState(v);
    subscribers.add(cb);
    // Sync up in case the value changed between render and effect attach.
    if (currentView !== view) setViewState(currentView);
    return () => {
      subscribers.delete(cb);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setView = useCallback((v: ListingView) => {
    setGlobalView(v);
  }, []);

  // Map current view to a density for ProductCard.
  const density: Density = (() => {
    if (NATIVE) {
      if (view === "single") return "single";
      if (view === "compact") return "compact";
      return "default";
    }
    if (view === "large") return "large";
    if (view === "compact") return "compact";
    return "default";
  })();

  // Tailwind grid column classes per view. The "default" web grid is kept
  // dense at lg/xl so it doesn't regress the pre-existing layouts on Home,
  // Landing, etc.
  const gridClasses: string = (() => {
    if (NATIVE) {
      switch (view) {
        case "single":
          return "grid grid-cols-1 gap-4";
        case "compact":
          return "grid grid-cols-4 gap-2";
        default:
          return "grid grid-cols-2 gap-3";
      }
    }
    switch (view) {
      case "large":
        return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6";
      case "compact":
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3";
      default:
        return "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4";
    }
  })();

  return {
    view,
    setView,
    density,
    gridClasses,
    isNative: NATIVE,
  };
}
