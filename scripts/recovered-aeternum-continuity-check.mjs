import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const mod = await server.ssrLoadModule('/lib/aeternum/index.ts');
  const { hortaCore } = await server.ssrLoadModule('/src/core/hortaCore.ts');

  const runtime = mod.recoveredAeternumRuntime;
  const result = runtime.boot();

  assert.equal(result.booted, true);
  assert.equal(result.modules, 8);
  assert.ok(result.connections > 0);
  assert.equal(result.bridge.connected, true);

  const systemStatus = hortaCore.get('continuity.recovered.aeternum.state.system.status');
  assert.equal(systemStatus, 'BOOTED');

  const runtimeState = hortaCore.get('continuity.recovered.aeternum.runtime');
  assert.equal(runtimeState?.status, 'BOOTED');
  assert.equal(runtimeState?.modules, 8);

  const forgeResult = await mod.neuralForgeModule.forge({
    name: 'continuity-check',
    purpose: 'verify no synthetic executor is claimed',
  });
  assert.equal(forgeResult.execution, 'not_claimed');
  assert.equal(forgeResult.status, 'handler_not_bound');

  console.log(JSON.stringify({
    status: 'PASS',
    modules: result.modules,
    connections: result.connections,
    mirroredChanges: result.bridge.mirroredChanges,
    neuralForge: forgeResult.execution,
  }, null, 2));
} finally {
  await server.close();
}
