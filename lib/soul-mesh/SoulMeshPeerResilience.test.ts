import assert from 'node:assert/strict';
import test from 'node:test';
import { SoulMeshPeerResilience } from './SoulMeshPeerResilience.ts';

test('opens routing after three failures and permits one half-open probe', () => {
  const resilience = new SoulMeshPeerResilience({ openCooldownMs: 1_000 });
  resilience.recordFailure('N03');
  resilience.recordFailure('N03');
  const opened = resilience.recordFailure('N03');
  assert.equal(opened.circuit, 'OPEN');
  assert.equal(opened.routable, false);

  const now = opened.checkedAt;
  assert.equal(resilience.canRoute('N03', now), false);
  assert.equal(resilience.canRoute('N03', now + 1_001), true);
  assert.equal(resilience.canRoute('N03', now + 1_001), false);
});

test('success closes the circuit and restores routing', () => {
  const resilience = new SoulMeshPeerResilience({ openCooldownMs: 1_000 });
  resilience.recordFailure('N04');
  resilience.recordFailure('N04');
  const opened = resilience.recordFailure('N04');
  assert.equal(resilience.canRoute('N04', opened.checkedAt + 1_001), true);
  const recovered = resilience.recordSuccess('N04');
  assert.equal(recovered.circuit, 'CLOSED');
  assert.equal(recovered.routable, true);
});
