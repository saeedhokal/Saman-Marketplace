import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initTikTokPixel } from "./lib/tiktokPixel";

initTikTokPixel();

createRoot(document.getElementById("root")!).render(<App />);
