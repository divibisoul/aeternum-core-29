import assert from 'node:assert/strict';
import { AeternumAGI, NeuralManagementCore } from './index';

const agi = AeternumAGI.getInstance();
agi.initialize();

assert.ok(agi.neuralManagement instanceof NeuralManagementCore);

const status = agi.neuralManagement.getStatus();
assert.equal(status.name, 'NeuralManagementCore');
assert.equal(status.neural.nodeCount, 22);
assert.ok(status.resources.modulesManaged >= 18);

const output = agi.neuralManagement.processSignal('SOUL');
assert.equal(output.length, 3);

const after = agi.neuralManagement.getStatus();
assert.equal(after.connected, true);
assert.ok(after.resources.modulesManaged >= status.resources.modulesManaged);

console.log(JSON.stringify({
  status: 'PASS',
  component: after.name,
  version: after.version,
  connected: after.connected,
  neuralNodes: after.neural.nodeCount,
  outputWidth: output.length,
  managedResources: after.resources.modulesManaged,
}, null, 2));
