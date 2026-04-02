import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { useLanguage } from "@/hooks/use-language";
import { motion, AnimatePresence } from "framer-motion";

const DISMISSED_KEY = "update_dismissed_version";

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

export function UpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [storeUrl, setStoreUrl] = useState("");
  const [forceUpdate, setForceUpdate] = useState(false);
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const checkVersion = async () => {
      try {
        const appInfo = await CapApp.getInfo();
        const currentVersion = appInfo.version;

        const res = await fetch("/api/app-version");
        if (!res.ok) return;
        const data = await res.json();

        if (compareVersions(data.latestVersion, currentVersion) > 0) {
          const dismissed = localStorage.getItem(DISMISSED_KEY);
          if (dismissed === data.latestVersion && !data.forceUpdate) return;

          const platform = Capacitor.getPlatform();
          setStoreUrl(platform === "ios" ? data.iosUrl : data.androidUrl);
          setForceUpdate(data.forceUpdate || false);
          setShowPrompt(true);
        }
      } catch {
      }
    };

    const timer = setTimeout(checkVersion, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (forceUpdate) return;
    fetch("/api/app-version")
      .then(r => r.json())
      .then(data => localStorage.setItem(DISMISSED_KEY, data.latestVersion))
      .catch(() => {});
    setShowPrompt(false);
  };

  const handleUpdate = () => {
    if (storeUrl) {
      window.open(storeUrl, "_system");
    }
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-6"
          style={{ pointerEvents: "auto" }}
          data-testid="update-prompt-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-border"
            dir={isRTL ? "rtl" : "ltr"}
            data-testid="update-prompt-dialog"
          >
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground" data-testid="text-update-title">
                {t("updateAvailable")}
              </h3>
            </div>

            <p className="text-sm text-muted-foreground text-center mb-6" data-testid="text-update-message">
              {t("updateMessage")}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleUpdate}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
                data-testid="button-update-now"
              >
                {t("updateNow")}
              </button>
              {!forceUpdate && (
                <button
                  onClick={handleDismiss}
                  className="w-full py-3 px-4 text-muted-foreground hover:text-foreground font-medium transition-colors"
                  data-testid="button-update-later"
                >
                  {t("later")}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
