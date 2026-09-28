import assert from 'node:assert/strict';
import { NeuralManagementCore } from '../src/core/agi/NeuralManagementCore.ts';
import { RecursiveNeuralLattice } from '../src/core/agi/RecursiveNeuralLattice.ts';
import { ResourceManager } from '../src/core/agi/ResourceManager.ts';

const lattice = new RecursiveNeuralLattice();
const resources = new ResourceManager();
resources.registerModule('NeuralManagementCore', 0.85);

const core = new NeuralManagementCore(lattice, resources);
const output = core.processSignal('SOUL');
assert.equal(Array.isArray(output), true);
assert.ok(output.length > 0);

const status = core.getStatus();
assert.equal(status.name, 'NeuralManagementCore');
assert.equal(status.connected, true);
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
