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
  assert.equal(result.neuralForgeExecution, 'not_claimed');

  const runtimeState = hortaCore.get('continuity.recovered.aeternum.runtime');
  assert.equal(runtimeState?.status, 'BOOTED');
  assert.equal(runtimeState?.modules, 8);

  console.log(JSON.stringify({
    status: 'PASS',
    modules: result.modules,
    connections: result.connections,
    sourceStateKeys: result.sourceStateKeys,
    currentStateKeys: result.currentStateKeys,
    neuralForgeExecution: result.neuralForgeExecution,
  }, null, 2));
} finally {
  await server.close();
}
