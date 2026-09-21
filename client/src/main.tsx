import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/desktop-marketplace-theme.css";
import { initTikTokPixel } from "./lib/tiktokPixel";
import { recordFirstRunIfNeeded } from "./lib/inAppReview";
import { initAppsFlyer } from "./lib/appsflyer";

initTikTokPixel();
recordFirstRunIfNeeded();
void initAppsFlyer();

createRoot(document.getElementById("root")!).render(<App />);
