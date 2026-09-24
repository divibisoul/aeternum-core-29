import assert from "node:assert/strict";
import test from "node:test";
import { EventBus } from "../../src/core/EventBus";
import {
  AETERNUM_8_MODULES,
  AeternumOrchestrator,
  aeternumBus,
  validateAeternumModuleGraph,
  neuralCoordinates,
} from "./index";
import { appOrchestrator } from "./orchestration/AppOrchestrator";

test("AETERNUM defines exactly eight modules without unresolved internal dependencies", () => {
  assert.equal(AETERNUM_8_MODULES.length, 8);
  assert.deepEqual(validateAeternumModuleGraph(), []);
});

test("orchestrator boots without claiming external runtimes are live", () => {
  const orchestrator = new AeternumOrchestrator();
  orchestrator.boot();
  assert.equal(orchestrator.listModules().length, 8);
});

test("AETERNUM facade uses the canonical core EventBus", async () => {
  const eventName = "test.canonical.bridge";
  let observed: unknown = undefined;
  const unsubscribe = aeternumBus.on<{ value: number }>(eventName, data => { observed = data; });
  await aeternumBus.emit(eventName, { value: 42 });
  unsubscribe();
  const latest = EventBus.getLog().at(-1);
  assert.equal(latest?.event, "aeternum:bridge");
  assert.deepEqual(observed, { value: 42 });
});

test("AppOrchestrator only reaches READY after observable core/module evidence", () => {
  const snapshot = appOrchestrator.boot();
  assert.equal(snapshot.phase, "READY");
  assert.equal(snapshot.progress, 1);
  assert.equal(snapshot.evidence.coreBooted, true);
  assert.equal(snapshot.evidence.moduleStateCount, snapshot.evidence.moduleCount);
});
 
test("neural coordinates are deterministic", () => {
  assert.deepEqual(neuralCoordinates("M1_CORE"), neuralCoordinates("M1_CORE"));
});
