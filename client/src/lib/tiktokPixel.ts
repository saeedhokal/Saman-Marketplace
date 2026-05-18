// Loads the TikTok web pixel if VITE_TIKTOK_PIXEL_ID is set at build time.
// Safe no-op if the env var is missing, so dev/preview builds skip the pixel.
//
// To activate: set VITE_TIKTOK_PIXEL_ID to your TikTok Pixel Code (from
// TikTok Ads Manager → Events Manager → your pixel → Setup) and rebuild.

export function initTikTokPixel() {
  const pixelId = (import.meta as any).env?.VITE_TIKTOK_PIXEL_ID as string | undefined;
  if (!pixelId) return;
  if (typeof window === "undefined") return;
  if ((window as any).ttq) return;

  (function (w: any, d: Document, t: string) {
    w.TiktokAnalyticsObject = t;
    const ttq: any = (w[t] = w[t] || []);
    ttq.methods = [
      "page", "track", "identify", "instances", "debug", "on", "off",
      "once", "ready", "alias", "group", "enableCookie", "disableCookie",
      "holdConsent", "revokeConsent", "grantConsent",
    ];
    ttq.setAndDefer = function (target: any, method: string) {
      target[method] = function () {
        target.push([method].concat(Array.prototype.slice.call(arguments, 0)));
      };
    };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (id: string) {
      const inst = ttq._i[id] || [];
      for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(inst, ttq.methods[i]);
      return inst;
    };
    ttq.load = function (id: string, options?: any) {
      const url = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._i = ttq._i || {};
      ttq._i[id] = [];
      ttq._i[id]._u = url;
      ttq._t = ttq._t || {};
      ttq._t[id] = +new Date();
      ttq._o = ttq._o || {};
      ttq._o[id] = options || {};
      const script = d.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src = url + "?sdkid=" + id + "&lib=" + t;
      const first = d.getElementsByTagName("script")[0];
      first.parentNode!.insertBefore(script, first);
    };
    ttq.load(pixelId);
    ttq.page();
  })(window as any, document, "ttq");
}
