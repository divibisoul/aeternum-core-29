import assert from 'node:assert/strict';
import test from 'node:test';
import { SoulMeshPeerResilience } from './SoulMeshPeerResilience.ts';

test('opens routing after three failures and permits one half-open probe', () => {
  const resilience = new SoulMeshPeerResilience({ openCooldownMs: 1 });
  resilience.recordFailure('N03');
  resilience.recordFailure('N03');
  const opened = resilience.recordFailure('N03');
  assert.equal(opened.circuit, 'OPEN');
  assert.equal(opened.routable, false);
  assert.equal(resilience.canRoute('N03', Date.now()), false);
  const probe = resilience.canRoute('N03', Date.now() + 2);
  assert.equal(probe, true);
  assert.equal(resilience.canRoute('N03', Date.now() + 2), false);
});

test('success closes the circuit and restores routing', () => {
  const resilience = new SoulMeshPeerResilience({ openCooldownMs: 1 });
  resilience.recordFailure('N04');
  resilience.recordFailure('N04');
  resilience.recordFailure('N04');
  assert.equal(resilience.canRoute('N04', Date.now() + 2), true);
  const recovered = resilience.recordSuccess('N04');
  assert.equal(recovered.circuit, 'CLOSED');
  assert.equal(recovered.routable, true);
});
