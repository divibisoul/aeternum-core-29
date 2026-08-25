import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { startSoulMeshRuntime } from "./core/mesh/SoulMeshRuntime";
import "./index.css";

startSoulMeshRuntime();
createRoot(document.getElementById("root")!).render(<App />);
