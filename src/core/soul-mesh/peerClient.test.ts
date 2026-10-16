import assert from 'node:assert/strict';
import test from 'node:test';
import { sendTo } from './peerClient.ts';

test('N01 keeps operation identity stable across retries and rotates nonce', async () => {
  const previousFetch = globalThis.fetch;
  const previousLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const requests: Array<{ id: string; correlationId: string; target: string; kind: string; meta?: { nonce?: string } }> = [];
  let attempts = 0;

  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { origin: 'https://n01-fusion.test' },
  });
  globalThis.fetch = async (_input, init) => {
    const request = JSON.parse(String(init?.body)) as (typeof requests)[number];
    requests.push(request);
    attempts += 1;
    const response = attempts === 1
      ? {
          protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: 'remote-error-1',
          correlationId: request.correlationId, source: 'N07', target: 'N01',
          kind: 'error', capability: 'mesh.ping', payload: { code: 'TEMPORARY' }, timestamp: Date.now(),
        }
      : {
          protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: 'remote-response-2',
          correlationId: request.correlationId, source: 'N07', target: 'N01',
          kind: 'response', capability: 'mesh.ping', payload: { ok: true }, timestamp: Date.now(),
        };
    return new Response(JSON.stringify(response), {
      status: attempts === 1 ? 503 : 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  try {
    const result = await sendTo('N07', 'mesh.ping', { probe: 'stable-retry-identity' }, 5000, 'n01-stable-correlation');
    assert.equal(result.kind, 'response');
    assert.equal(attempts, 2);
    assert.equal(requests[0].id, requests[1].id);
    assert.notEqual(requests[0].meta?.nonce, requests[1].meta?.nonce);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousLocation) Object.defineProperty(globalThis, 'location', previousLocation);
    else delete (globalThis as typeof globalThis & { location?: Location }).location;
  }
});
