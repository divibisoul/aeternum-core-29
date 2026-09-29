import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const mod = await server.ssrLoadModule("/lib/aeternum/index.ts");
  const result = mod.recoveredAeternumRuntime.boot();
  assert.equal(result.booted, true);
  assert.equal(result.modules, 8);
  assert.ok(result.connections > 0);
  assert.equal(result.neuralForgeExecution, "not_claimed");

  const guide = await mod.recoveredAeternumCapabilityBridge.execute("aeternum.architecture.guide", { domain: "core" });
  assert.ok(guide);
  assert.ok(Array.isArray(guide.modules));

  const blueprint = await mod.recoveredAeternumCapabilityBridge.execute("aeternum.blueprint.create", {
    name: "continuity-proof",
    requirements: ["hortaCore", "eventBus", "mesh"],
  });
  assert.ok(blueprint);
  assert.equal(blueprint.execution, "derived_from_request");

  const forge = await mod.recoveredAeternumCapabilityBridge.execute("aeternum.neuralforge.create", {
    name: "continuity-proof",
    purpose: "verify truthful executor boundary",
  });
  assert.equal(forge.execution, "not_claimed");

  console.log(JSON.stringify({ status: "PASS", modules: result.modules, connections: result.connections, guideModules: guide.modules.length, blueprint: blueprint.id, neuralForge: forge.execution }, null, 2));
} finally { await server.close(); }