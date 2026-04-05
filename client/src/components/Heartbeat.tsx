import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

export function Heartbeat() {
  useEffect(() => {
    const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "web";

    const sendHeartbeat = () => {
      fetch("/api/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
