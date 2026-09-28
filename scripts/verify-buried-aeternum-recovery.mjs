import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const mod = await server.ssrLoadModule('/lib/aeternum/index.ts');
  const required = [
    'AeternumEventBus',
    'AeternumHortaCore',
    'AeternumWormholeRegistry',
    'AeternumOrchestrator',
    'ArchitectureGuideModule',
    'BlueprintModule',
    'NeuralForgeModule',
  ];

  const missing = required.filter(name => !(name in mod));
  assert.deepEqual(missing, []);

  const map = mod.AETERNUM_8_MODULES;
  assert.ok(Array.isArray(map));
  assert.equal(map.length, 8);

  const orchestrator = new mod.AeternumOrchestrator();
  orchestrator.boot();
  assert.equal(orchestrator.listModules().length, 8);
  assert.equal(orchestrator.listDeclaredModules().length, 8);

  console.log(JSON.stringify({
    status: 'PASS',
    recoveredExports: required.length,
    declaredModules: orchestrator.listDeclaredModules().length,
    connections: orchestrator.listConnections().length,
  }, null, 2));
} finally {
  await server.close();
}
