import assert from 'node:assert/strict';
import { SoulMeshHealth } from './SoulMeshHealth.ts';

const health = new SoulMeshHealth({ failureThreshold: 3, openCooldownMs: 10 });
assert.equal(health.getCircuitState(), 'CLOSED');
health.recordFailure();
health.recordFailure();
assert.equal(health.getSnapshot().state, 'DEGRADED');
health.recordFailure();
assert.equal(health.getSnapshot().state, 'UNREACHABLE');
assert.equal(health.getCircuitState(), 'OPEN');
assert.equal(health.canAttempt(Date.now()), false);
assert.equal(health.canAttempt(Date.now() + 11), true);
assert.equal(health.getCircuitState(), 'HALF_OPEN');
assert.equal(health.canAttempt(Date.now() + 12), false);
health.recordSuccess();
assert.equal(health.getCircuitState(), 'CLOSED');
assert.equal(health.getSnapshot().state, 'READY');
console.log('SoulMeshHealth: PASS');
