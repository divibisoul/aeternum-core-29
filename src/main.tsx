import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { androidSoulBridge } from "./core/bridges/AndroidSoulBridge";
import "./index.css";

// The Core owns orchestration; Sentinel owns Android perception.
// Start the bridge once the Web runtime exists inside the Android shell.
androidSoulBridge.start();

createRoot(document.getElementById("root")!).render(<App />);
