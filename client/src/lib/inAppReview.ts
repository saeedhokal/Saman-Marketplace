import { Capacitor } from "@capacitor/core";

const LAST_PROMPT_KEY = "iar:lastPromptAt";
const FIRST_RUN_KEY = "iar:firstRunAt";
const MIN_DAYS_SINCE_INSTALL = 0;
const MIN_DAYS_BETWEEN_PROMPTS = 0;

function daysSince(ts: number): number {
  return (Date.now() - ts) / 86_400_000;
}

export function recordFirstRunIfNeeded(): void {
  try {
    if (!localStorage.getItem(FIRST_RUN_KEY)) {
      localStorage.setItem(FIRST_RUN_KEY, String(Date.now()));
    }
  } catch {}
}

export async function requestInAppReviewIfEligible(): Promise<void> {
  const debugToast = (msg: string) => {
    try { (window as any).__iarDebug?.(msg); } catch {}
  };

  if (!Capacitor.isNativePlatform()) {
    debugToast("review: not native");
    return;
  }

  try {
    const firstRunStr = localStorage.getItem(FIRST_RUN_KEY);
    const firstRun = firstRunStr ? Number(firstRunStr) : Date.now();
    if (!firstRunStr) localStorage.setItem(FIRST_RUN_KEY, String(firstRun));

    if (daysSince(firstRun) < MIN_DAYS_SINCE_INSTALL) {
      debugToast(`review: throttled install ${daysSince(firstRun).toFixed(2)}d`);
      return;
    }

    const lastStr = localStorage.getItem(LAST_PROMPT_KEY);
    if (lastStr && daysSince(Number(lastStr)) < MIN_DAYS_BETWEEN_PROMPTS) {
      debugToast(`review: throttled last ${daysSince(Number(lastStr)).toFixed(2)}d`);
      return;
    }

    debugToast("review: calling requestReview");
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
    localStorage.setItem(LAST_PROMPT_KEY, String(Date.now()));
    debugToast("review: requestReview returned OK");
  } catch (err: any) {
    console.warn("InAppReview prompt skipped:", err);
    debugToast(`review error: ${err?.message || err}`);
  }
}
