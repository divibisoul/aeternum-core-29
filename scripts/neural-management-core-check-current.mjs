import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const { AeternumAGI } = await server.ssrLoadModule('/src/core/agi/index.ts');
  const agi = AeternumAGI.getInstance();
  agi.initialize();

  assert.ok(agi.neuralManagement, 'NeuralManagementCore must be attached to AeternumAGI');

  const before = agi.neuralManagement.getStatus();
  assert.equal(before.name, 'NeuralManagementCore');
  assert.equal(before.neural.nodeCount, 22);
  assert.ok(before.resources.modulesManaged >= 1);

  const output = agi.neuralManagement.processSignal('SOUL');
  assert.equal(output.length, 4);

  const after = agi.neuralManagement.getStatus();
  assert.equal(after.connected, true);
  assert.ok(after.resources.modulesManaged >= before.resources.modulesManaged);
  assert.ok(after.resources.hotModules.includes('neuralManagement'));

  console.log(JSON.stringify({
    status: 'PASS',
    component: after.name,
    version: after.version,
    connected: after.connected,
    neuralNodes: after.neural.nodeCount,
    outputWidth: output.length,
    managedResources: after.resources.modulesManaged,
    neuralLearningSteps: after.neural.learningSteps,
  }, null, 2));
} finally {
  await server.close();
}
