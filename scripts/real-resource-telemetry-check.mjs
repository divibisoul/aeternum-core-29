import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ResourceManager } from '../src/core/agi/ResourceManager.ts';
import { RecursiveNeuralLattice } from '../src/core/agi/RecursiveNeuralLattice.ts';

const resourceSource = fs.readFileSync(new URL('../src/core/agi/ResourceManager.ts', import.meta.url), 'utf8');
const latticeSource = fs.readFileSync(new URL('../src/core/agi/RecursiveNeuralLattice.ts', import.meta.url), 'utf8');

assert.equal(resourceSource.includes('Math.random'), false);
assert.equal(resourceSource.includes('Simulate CPU usage'), false);
assert.equal(resourceSource.includes('Simulate memory usage'), false);
assert.equal(latticeSource.includes('Math.random'), false);

const resourceManager = new ResourceManager();
resourceManager.registerModule('integration-check', 0.8);
resourceManager.start(10, 50);
await new Promise(resolve => setTimeout(resolve, 80));
resourceManager.stop();

const resourceMetrics = resourceManager.getMetrics();
assert.equal(resourceMetrics.telemetry.status, 'MEASURED');
assert.equal(resourceMetrics.telemetry.cpuSource, 'process.cpuUsage(user+system)/wall-time');
assert.equal(resourceMetrics.telemetry.memorySource, 'process.memoryUsage(heapUsed/heapTotal)');

const lattice = new RecursiveNeuralLattice();
const latticeMetrics = lattice.getMetrics();
assert.equal(latticeMetrics.nodeCount, 22);
assert.ok(latticeMetrics.connectionCount > 0);

console.log(JSON.stringify({
  status: 'PASS',
  telemetry: resourceMetrics.telemetry,
  cpuUsage: resourceMetrics.totalCpuUsage,
  memoryUsage: resourceMetrics.totalMemoryUsage,
  latticeNodes: latticeMetrics.nodeCount,
  latticeConnections: latticeMetrics.connectionCount,
}, null, 2));
