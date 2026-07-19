import { useEffect, useState } from "react";
import samanLogo from "@/assets/images/saman-logo-transparent.png";

const APP_STORE_URL = "https://apps.apple.com/app/id6744526430";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.saman.marketplace";

function getDevice(): "ios" | "android" | "desktop" {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

/**
 * Validate that path is a safe internal relative path.
 * Must start with exactly one "/" and must NOT be a protocol-relative ("//...")
 * or absolute URL. Rejects "javascript:", "data:", "https://", etc.
 */
function sanitizePath(raw: string | null): string {
  if (!raw) return "/";
  // Must start with a single "/" but not "//"
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  // Must not contain protocol indicators
  if (/^\/[a-zA-Z][a-zA-Z0-9+\-.]*:/.test(raw)) return "/";
  return raw;
}

export default function AppOpen() {
  const params = new URLSearchParams(window.location.search);
  const path = sanitizePath(params.get("path"));
  const device = getDevice();

  const [status, setStatus] = useState<"trying" | "failed">("trying");

  useEffect(() => {
    // Desktop — go straight to the website path
    if (device === "desktop") {
      window.location.replace(path);
      return;
    }

    // Mobile — attempt custom URL scheme
    // saman:// + path without leading slash, e.g. saman://product/123
    const schemePath = path.startsWith("/") ? path.slice(1) : path;
    const schemeUrl = `saman://${schemePath}`;

    let redirected = false;
    const storeUrl = device === "ios" ? APP_STORE_URL : PLAY_STORE_URL;

    // When the user leaves the page (app opened), cancel the fallback
    const handleVisibilityChange = () => {
      if (document.hidden) redirected = true;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Give the OS a moment then try the scheme
    const schemeTimer = setTimeout(() => {
      window.location.href = schemeUrl;
    }, 100);

    // After 1.5 s, if still here the app isn't installed → go straight to store
    const fallbackTimer = setTimeout(() => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (!redirected) {
        setStatus("failed");
        window.location.href = storeUrl;
      }
    }, 1500);

    return () => {
      clearTimeout(schemeTimer);
      clearTimeout(fallbackTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [device, path]);

  const storeUrl = device === "ios" ? APP_STORE_URL : PLAY_STORE_URL;
  const storeName = device === "ios" ? "App Store" : "Google Play";

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <img
        src={samanLogo}
        alt="Saman Marketplace"
        className="w-20 h-20 rounded-2xl shadow-lg mb-8 object-contain"
      />

      {status === "trying" ? (
        <>
          <div className="w-10 h-10 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mb-6" />
          <h1 className="text-xl font-bold text-foreground mb-2">Opening Saman…</h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            If the app doesn't open,{" "}
            <a
              href={storeUrl}
              className="text-orange-500 underline font-medium"
              data-testid="link-store"
            >
              download it from the {storeName}
            </a>
            .
          </p>
          {device === "ios" && (
            <p className="mt-4 text-xs text-muted-foreground max-w-xs">
              On Instagram, tap <strong>⋯ → Open in Safari</strong> for the best experience.
            </p>
          )}
        </>
      ) : (
        <>
          <h1 className="text-xl font-bold text-foreground mb-2">Redirecting to {storeName}…</h1>
          <p className="text-muted-foreground text-sm max-w-xs mb-6">
            Taking you to download Saman.
          </p>
          <a
            href={storeUrl}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            data-testid="button-download"
          >
            Download Saman
          </a>
          <a
            href={`https://thesamanapp.com${path}`}
            className="mt-4 text-sm text-muted-foreground underline"
            data-testid="link-website"
          >
            Continue to website instead
          </a>
        </>
      )}
    </div>
  );
}
