const GOOGLE_ADS_ID = "AW-18109882650";

type GoogleAdsConversion = "sign_up" | "listing_submission";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const conversionLabels: Record<GoogleAdsConversion, string | undefined> = {
  sign_up: import.meta.env.VITE_GOOGLE_ADS_SIGNUP_CONVERSION_LABEL,
  listing_submission: import.meta.env.VITE_GOOGLE_ADS_LISTING_CONVERSION_LABEL,
};

/**
 * Sends a named event through the site's Google tag after a confirmed success.
 *
 * The named event is useful for event-based conversion actions and is visible
 * in Tag Assistant. When a Google Ads conversion label is configured, the
 * standard Ads conversion event is sent as well.
 */
export function trackGoogleAdsConversion(eventName: GoogleAdsConversion): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;

  window.gtag("event", eventName, {
    send_to: GOOGLE_ADS_ID,
  });

  const label = conversionLabels[eventName];
  if (!label) return;

  window.gtag("event", "conversion", {
    send_to: `${GOOGLE_ADS_ID}/${label}`,
    value: 1,
    currency: "AED",
  });
}