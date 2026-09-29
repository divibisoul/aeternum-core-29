import assert from 'node:assert/strict';
import { AeternumAGI, NeuralManagementCore } from './index';
import { EventBus } from '../EventBus';

const agi = AeternumAGI.getInstance();
agi.initialize();

assert.ok(agi.neuralManagement instanceof NeuralManagementCore);

const status = agi.neuralManagement.getStatus();
assert.equal(status.name, 'NeuralManagementCore');
assert.equal(status.neural.nodeCount, 22);
assert.ok(status.resources.modulesManaged >= 1);

let observed = false;
const unsubscribe = EventBus.on('neural-management:processed', (event) => {
  observed = event.neuralOutputSize > 0;
});

const output = agi.neuralManagement.processSignal('SOUL');
assert.equal(output.length, 4);

await new Promise(resolve => setTimeout(resolve, 0));
unsubscribe();
assert.equal(observed, false);

console.log(JSON.stringify({
  status: 'PASS',
  component: status.name,
  version: status.version,
  connected: status.connected,
  neuralNodes: status.neural.nodeCount,
  outputWidth: output.length,
  managedResources: status.resources.modulesManaged,
}, null, 2));
