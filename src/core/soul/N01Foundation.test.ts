import assert from 'node:assert/strict';
import { createEnvelope } from './SoulMeshEnvelope';
import { N01RuntimeGate } from './N01RuntimeGate';
import { runN01StructuralSelfCheck } from './N01StructuralSelfCheck';

const secret = 'n01-foundation-test-secret-32';

const structural = await runN01StructuralSelfCheck(secret);
assert.equal(structural.envelope, true);
assert.equal(structural.authorizationReady, true);
assert.ok(structural.capabilities >= 1);

const gate = new N01RuntimeGate({ secret });
const request = await createEnvelope({
  version: '1.0',
  source: 'N02',
  target: 'N01',
  type: 'TASK',
  payload: { capabilityId: 'cognitive.orchestration', permission: 'cognitive:orchestrate' },
}, secret);
assert.equal(await gate.accept(request), true);
assert.equal(await gate.accept(request), false); // replay must fail closed

const tampered = { ...request, payload: { capabilityId: 'mesh.transport.negotiate', permission: 'mesh:negotiate' } };
assert.equal(await gate.accept(tampered), false);

console.log('N01 foundation security/capability checks: PASS');