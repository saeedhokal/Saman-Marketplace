import { Capacitor } from "@capacitor/core";
import { AppsFlyer } from "appsflyer-capacitor-plugin";

const IOS_APP_STORE_ID = "6744526430";

let initialization: Promise<void> | null = null;

/**
 * Initializes AppsFlyer once per native app launch. The native SDK records
 * installs, updates, and sessions automatically after a successful init.
 */
export function initAppsFlyer(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve();
  if (initialization) return initialization;

  initialization = (async () => {
    if (!__APPSFLYER_DEV_KEY__) {
      console.error("[AppsFlyer] Dev key is not configured");
      return;
    }

    try {
      await AppsFlyer.initSDK({
        devKey: __APPSFLYER_DEV_KEY__,
        appID: IOS_APP_STORE_ID,
        isDebug: import.meta.env.DEV,
        // AppDelegate owns the shared iOS ATT prompt used by attribution SDKs.
        waitForATTUserAuthorization: 10,
      });
      console.info("[AppsFlyer] Native SDK initialized");
    } catch (error) {
      console.error("[AppsFlyer] Native SDK initialization failed", error);
    }
  })();

  return initialization;
}

export async function logAppsFlyerEvent(
  eventName: string,
  eventValue: Record<string, string | number | boolean> = {},
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await initAppsFlyer();
  try {
    await AppsFlyer.logEvent({ eventName, eventValue });
  } catch (error) {
    console.error(`[AppsFlyer] Failed to log ${eventName}`, error);
  }
}