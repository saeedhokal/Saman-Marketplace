import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { getAuthHeaders } from "@/lib/queryClient";

export function Heartbeat() {
  useEffect(() => {
    const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "web";

    const sendHeartbeat = () => {
      fetch("/api/heartbeat", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ platform }),
      }).catch(() => {});
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 30000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
