import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { androidSoulBridge } from "./core/bridges/AndroidSoulBridge";
import { nexusSoulBridge } from "./core/bridges/NexusSoulBridge";
import "./index.css";

// Core owns orchestration. Android Sentinel owns Android perception.
androidSoulBridge.start();
// Nexus owns interaction/multimodal capabilities; Core only transports/orchestrates them.
nexusSoulBridge.start();

createRoot(document.getElementById("root")!).render(<App />);
