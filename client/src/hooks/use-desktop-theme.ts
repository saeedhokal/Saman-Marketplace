import { useEffect, useLayoutEffect, useState } from "react";

export type DesktopTheme = "daytime" | "nighttime";

const KEY = "saman-desktop-theme";
const EVENT = "saman-desktop-theme-change";

function readTheme(): DesktopTheme {
  if (typeof window === "undefined") return "nighttime";
  return window.localStorage.getItem(KEY) === "daytime" ? "daytime" : "nighttime";
}

function applyTheme(theme: DesktopTheme) {
  document.documentElement.dataset.desktopTheme = theme;
}

export function useDesktopTheme() {
  const [theme, setThemeState] = useState<DesktopTheme>(readTheme);

  useLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const sync = () => setThemeState(readTheme());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const setTheme = (next: DesktopTheme) => {
    window.localStorage.setItem(KEY, next);
    applyTheme(next);
    setThemeState(next);
    window.dispatchEvent(new Event(EVENT));
  };

  return { theme, setTheme };
}