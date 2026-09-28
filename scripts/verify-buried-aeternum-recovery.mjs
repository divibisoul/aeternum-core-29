import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const index = await server.ssrLoadModule('/lib/aeternum/index.ts');
  const forge = await server.ssrLoadModule('/lib/aeternum/evolution/NeuralForgeModule.ts');
  const blueprint = await server.ssrLoadModule('/lib/aeternum/evolution/BlueprintModule.ts');
  const guide = await server.ssrLoadModule('/lib/aeternum/governance/ArchitectureGuideModule.ts');

  for (const [label, mod] of [
    ['AeternumEventBus', index],
    ['AeternumHortaCore', index],
    ['AeternumWormholeRegistry', index],
    ['AeternumOrchestrator', index],
    ['ArchitectureGuideModule', guide],
    ['BlueprintModule', blueprint],
    ['NeuralForgeModule', forge],
  ]) {
    assert.equal(typeof mod[label], 'function', label + ' export missing');
  }

  assert.ok(Array.isArray(index.AETERNUM_8_MODULES));
  assert.equal(index.AETERNUM_8_MODULES.length, 8);

  const orchestrator = new index.AeternumOrchestrator();
  orchestrator.boot();
  assert.equal(orchestrator.listModules().length, 8);
  assert.equal(orchestrator.listDeclaredModules().length, 8);

  const guideInstance = new guide.ArchitectureGuideModule();
  const map = guideInstance.generateMap();
  assert.equal(map.totalDeclaredModules, 8);

  console.log(JSON.stringify({
    status: 'PASS',
    recoveredExports: 7,
    declaredModules: orchestrator.listDeclaredModules().length,
    connections: orchestrator.listConnections().length,
    guideDeclaredModules: map.totalDeclaredModules,
  }, null, 2));
} finally {
  await server.close();
}
