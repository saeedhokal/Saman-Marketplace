import { MoonStar, SunMedium } from "lucide-react";
import { useDesktopTheme } from "@/hooks/use-desktop-theme";

export function DesktopThemeToggle() {
  const { theme, setTheme } = useDesktopTheme();
  return (
    <div className="desktop-theme-toggle" role="group" aria-label="Desktop color theme">
      <button className={theme === "daytime" ? "is-active" : ""} onClick={() => setTheme("daytime")} aria-pressed={theme === "daytime"}>
        <SunMedium size={13} /> <span>Daytime</span>
      </button>
      <button className={theme === "nighttime" ? "is-active" : ""} onClick={() => setTheme("nighttime")} aria-pressed={theme === "nighttime"}>
        <MoonStar size={13} /> <span>Nighttime</span>
      </button>
    </div>
  );
}