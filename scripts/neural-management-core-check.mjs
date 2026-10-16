import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const mod = await server.ssrLoadModule('/src/core/agi/NeuralManagementCore.ts');
  const latticeMod = await server.ssrLoadModule('/src/core/agi/RecursiveNeuralLattice.ts');
  const resourceMod = await server.ssrLoadModule('/src/core/agi/ResourceManager.ts');

  const { NeuralManagementCore } = mod;
  const { RecursiveNeuralLattice } = latticeMod;
  const { ResourceManager } = resourceMod;

  const lattice = new RecursiveNeuralLattice();
  const resources = new ResourceManager();
  resources.registerModule('NeuralManagementCore', 0.85);

  const core = new NeuralManagementCore(lattice, resources);
  resources.start(10, 50);
  let output;
  let status;
  try {
    output = core.processSignal('SOUL');
    assert.equal(Array.isArray(output), true);
    assert.ok(output.length > 0);

    // The integrated public status must expose the same real samples as ResourceManager.
    await new Promise(resolve => setTimeout(resolve, 80));
    status = core.getStatus();
  } finally {
    resources.stop();
  }
  assert.equal(status.name, 'NeuralManagementCore');
  assert.equal(status.connected, true);
  assert.ok(status.neural.nodeCount > 0);
  assert.ok(status.resources.modulesManaged > 0);
  assert.equal(status.resources.telemetry.status, 'MEASURED');
  assert.equal(status.resources.telemetry.cpuSource, 'process.cpuUsage(user+system)/wall-time');
  assert.equal(status.resources.telemetry.memorySource, 'process.memoryUsage(heapUsed/heapTotal)');
  assert.equal(status.neural.nodeCount, 22);
  assert.equal(status.processing.totalProcessed, 0);
  assert.equal(status.resources.modulesManaged, 1);

  console.log(JSON.stringify({
    status: 'PASS',
    component: status.name,
    version: status.version,
    neuralNodes: status.neural.nodeCount,
    outputWidth: output.length,
    managedResources: status.resources.modulesManaged,
  }, null, 2));
} finally {
  await server.close();
}