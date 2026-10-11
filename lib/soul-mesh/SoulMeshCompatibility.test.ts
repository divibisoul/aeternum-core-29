import assert from 'node:assert/strict';
import test from 'node:test';
import { createEnvelope, MESSAGE_TYPES, signEnvelope, verifyEnvelope, SOUL_MESH_CONTRACT_VERSION, type SoulMeshEnvelope } from './SoulMeshEnvelope.ts';

test('canonical envelope includes the required contractVersion', () => {
  const envelope = createEnvelope({
    source: 'N01',
    target: 'N02',
    correlationId: 'compat-test',
    type: 'PING',
    payload: { ok: true },
  });
  assert.equal(envelope.version, '1.0');
  assert.equal(envelope.contractVersion, SOUL_MESH_CONTRACT_VERSION);
});

test('legacy version remains representable without changing the canonical contract', () => {
  const legacy: SoulMeshEnvelope = {
    version: '1.0',
    contractVersion: SOUL_MESH_CONTRACT_VERSION,
    messageId: 'legacy-message',
    source: 'N02',
    target: 'N01',
    timestamp: Date.now(),
    nonce: 'legacy-nonce',
    correlationId: 'legacy-correlation',
    type: 'PING',
    hmac: '0'.repeat(64),
    payload: {},
  };
  assert.equal(legacy.version, '1.0');
  assert.equal(legacy.contractVersion, '1.1.0');
});

test('canonical Mesh supports the complete 1.1.0 message-type vocabulary', () => {
  assert.deepEqual(MESSAGE_TYPES, [
    'PING', 'HEALTH', 'DISCOVERY_REQUEST', 'DISCOVERY_RESPONSE',
    'CAPABILITY_REQUEST', 'TASK', 'TASK_RESULT', 'ERROR',
    'COMBO_REQUEST', 'COMBO_RESULT', 'EVENT',
  ]);
  const envelope = createEnvelope({
    source: 'N01',
    target: 'N07',
    correlationId: 'contract-1-1-0',
    type: 'COMBO_REQUEST',
    payload: { steps: [] },
  });
  assert.equal(envelope.type, 'COMBO_REQUEST');
});

test('canonical Mesh rejects HMAC keys shorter than the N07 32-byte minimum', async () => {
  const envelope = createEnvelope({
    source: 'N01',
    target: 'N02',
    correlationId: 'hmac-short-key',
    type: 'PING',
    payload: {},
  });
  await assert.rejects(
    () => signEnvelope(envelope, new Uint8Array(31)),
    /at least 32 bytes/,
  );
});

test('canonical Mesh signs and verifies with a 32-byte key', async () => {
  const envelope = createEnvelope({
    source: 'N01',
    target: 'N07',
    correlationId: 'hmac-32-byte-key',
    type: 'DISCOVERY_REQUEST',
    payload: { nucleus: 'N07' },
  });
  const secret = new TextEncoder().encode('01234567890123456789012345678901');
  const signed = await signEnvelope(envelope, secret);
  assert.equal(await verifyEnvelope(signed, secret, { requireContractVersion: true }), true);
});
