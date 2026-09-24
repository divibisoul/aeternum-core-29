import { AETERNUM_8_MODULES } from "../lib/aeternum/AeternumModuleMap.ts";
import { AeternumOrchestrator } from "../lib/aeternum/AeternumOrchestrator.ts";
import { AeternumEventBus } from "../lib/aeternum/EventBus.ts";
import { AeternumHortaCore } from "../lib/aeternum/HortaCore.ts";
import { AeternumWormholeRegistry } from "../lib/aeternum/WormholeRegistry.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error("AETERNUM_CORE_CONTRACT:" + message);
}

const orchestrator = new AeternumOrchestrator(
  new AeternumEventBus(),
  new AeternumHortaCore(),
  new AeternumWormholeRegistry(),
);

orchestrator.boot();

const declared = orchestrator.listDeclaredModules();
assert(declared.length === 8, "expected eight declared modules");

const expectedEdges = AETERNUM_8_MODULES.reduce(
  (total, module) => total + module.dependencies.length,
  0,
);
assert(
  orchestrator.listConnections().length === expectedEdges,
  "dependency graph edge count mismatch",
);

const allEdges = new Set(
  orchestrator.listConnections().map(edge => edge.sourceId + "->" + edge.targetId),
);
for (const module of AETERNUM_8_MODULES) {
  for (const dependency of module.dependencies) {
    assert(
      allEdges.has(dependency + "->" + module.id),
      "missing dependency edge " + dependency + "->" + module.id,
    );
  }
}

const declaredCapabilityOwners = new Set(
  declared.flatMap(module => module.capabilities.map(capability => module.id + ":" + capability)),
);
assert(declaredCapabilityOwners.size > 0, "capability declarations are empty");

console.log("AETERNUM core contract OK", {
  modules: declared.length,
  edges: allEdges.size,
});
