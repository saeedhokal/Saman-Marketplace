import { Capacitor } from "@capacitor/core";

const LAST_PROMPT_KEY = "iar:lastPromptAt";
const FIRST_RUN_KEY = "iar:firstRunAt";
const MIN_DAYS_SINCE_INSTALL = 3;
const MIN_DAYS_BETWEEN_PROMPTS = 60;

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
  if (!Capacitor.isNativePlatform()) return;

  try {
    const firstRunStr = localStorage.getItem(FIRST_RUN_KEY);
    const firstRun = firstRunStr ? Number(firstRunStr) : Date.now();
    if (!firstRunStr) localStorage.setItem(FIRST_RUN_KEY, String(firstRun));

    if (daysSince(firstRun) < MIN_DAYS_SINCE_INSTALL) return;

    const lastStr = localStorage.getItem(LAST_PROMPT_KEY);
    if (lastStr && daysSince(Number(lastStr)) < MIN_DAYS_BETWEEN_PROMPTS) return;

    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
    localStorage.setItem(LAST_PROMPT_KEY, String(Date.now()));
  } catch (err) {
    console.warn("InAppReview prompt skipped:", err);
  }
}
