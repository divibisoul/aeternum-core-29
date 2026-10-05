import assert from 'node:assert/strict';
import { ProjetoClareira } from './ProjetoClareira';
import { VagusNerve } from './VagusNerve';

assert.ok(ProjetoClareira);
assert.equal(typeof VagusNerve, 'function');
const metrics = ProjetoClareira.getMetrics();
assert.ok(typeof metrics.vagalTone === 'number');
assert.ok(typeof metrics.activeVagusBranches === 'number');
assert.ok(typeof metrics.redundantVagusBranches === 'number');
assert.equal(metrics.vagalSignalLatencyMs, undefined);
console.log('N01_VAGUS_CLAREIRA_SURFACE: PASS');
