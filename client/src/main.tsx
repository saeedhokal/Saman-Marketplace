import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initTikTokPixel } from "./lib/tiktokPixel";
import { recordFirstRunIfNeeded } from "./lib/inAppReview";

initTikTokPixel();
recordFirstRunIfNeeded();

createRoot(document.getElementById("root")!).render(<App />);
