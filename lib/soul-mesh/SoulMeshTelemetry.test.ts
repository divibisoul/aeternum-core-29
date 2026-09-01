import { SoulMeshTelemetry } from "./SoulMeshTelemetry.ts";

const originalLog = console.log;
const lines: string[] = [];
console.log = (...args: unknown[]) => lines.push(String(args[0]));

try {
  const telemetry = new SoulMeshTelemetry("N01");
  const record = telemetry.emit("mesh.request.started", {
    source: "N01",
    target: "N06",
    requestId: "req-test",
    correlationId: "corr-test",
    capability: "system.ping",
    transport: "http",
  });

  if (record.nucleus !== "N01") throw new Error("nucleus missing");
  if (record.correlationId !== "corr-test") throw new Error("correlationId missing");
  if (!record.timestamp) throw new Error("timestamp missing");
  if (lines.length !== 1) throw new Error("expected one structured log record");

  const parsed = JSON.parse(lines[0]);
  if (parsed.soulMesh.event !== "mesh.request.started") throw new Error("event mismatch");
  if (parsed.soulMesh.target !== "N06") throw new Error("target mismatch");
  if ("payload" in parsed.soulMesh) throw new Error("payload must not be logged");

  originalLog("SoulMeshTelemetry test: PASS");
} finally {
  console.log = originalLog;
}
