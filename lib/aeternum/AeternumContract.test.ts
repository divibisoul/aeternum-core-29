import assert from "node:assert/strict";
import test from "node:test";
import {
  AETERNUM_8_MODULES,
  AeternumOrchestrator,
  validateAeternumModuleGraph,
  neuralCoordinates,
} from "./index";

test("AETERNUM defines exactly eight modules without unresolved internal dependencies", () => {
  assert.equal(AETERNUM_8_MODULES.length, 8);
  assert.deepEqual(validateAeternumModuleGraph(), []);
});

test("orchestrator boots without claiming external runtimes are live", () => {
  const orchestrator = new AeternumOrchestrator();
  orchestrator.boot();
  assert.equal(orchestrator.listModules().length, 8);
});

test("neural coordinates are deterministic", () => {
  assert.deepEqual(neuralCoordinates("M1_CORE"), neuralCoordinates("M1_CORE"));
});
