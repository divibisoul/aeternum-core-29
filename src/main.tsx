import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { startSoulMeshRuntime } from "./core/mesh/SoulMeshRuntime";
import { assertSoulFabricTopology } from "./core/SoulFabricContract";
import "./index.css";

// Fail fast on an invalid six-nucleus/60-channel topology. This validates structure only;
// it intentionally does not claim that remote runtimes are connected.
assertSoulFabricTopology();
startSoulMeshRuntime();
createRoot(document.getElementById("root")!).render(<App />);
