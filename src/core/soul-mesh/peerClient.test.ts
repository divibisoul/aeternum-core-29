import assert from 'node:assert/strict';
import test from 'node:test';
import { sendTo, setSoulMeshSessionAccessTokenProvider } from './peerClient.ts';

function setTestLocation() {
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'location');
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { origin: 'https://n01-fusion.test' } });
  return () => {
    if (prior) Object.defineProperty(globalThis, 'location', prior);
    else delete (globalThis as typeof globalThis & { location?: Location }).location;
  };
}

test('N01 browser peer requests use the authenticated same-origin relay and retry only safe diagnostics', async () => {
  const previousFetch = globalThis.fetch;
  const restoreLocation = setTestLocation();
  const calls: Array<{ url: string; authorization: string | null; body: Record<string, unknown> }> = [];
  let attempts = 0;
  setSoulMeshSessionAccessTokenProvider(async () => 'supabase-session-token-for-test');

  globalThis.fetch = async (input, init) => {
    attempts += 1;
    const headers = new Headers(init?.headers);
    calls.push({
      url: String(input),
      authorization: headers.get('authorization'),
      body: JSON.parse(String(init?.body)) as Record<string, unknown>,
    });
    if (attempts === 1) return new Response(JSON.stringify({ error: 'TEMPORARY_UPSTREAM_FAILURE' }), { status: 503 });
    const body = calls[1].body;
    return new Response(JSON.stringify({
      protocol: 'soul-mesh/1',
      contractVersion: '1.1.0',
      id: 'verified-n07-response',
      correlationId: body.correlationId,
      source: 'N07',
      target: 'N01',
      kind: 'response',
      capability: 'mesh.ping',
      payload: { ok: true, nucleus: 'N07' },
      timestamp: Date.now(),
      meta: { nonce: 'server-issued-nonce' },
    }), { status: 200, headers: { 'content-type': 'application/json' } });
  };

  try {
    const result = await sendTo('N07', 'mesh.ping', { probe: 'same-origin-relay' }, 5000, 'n01-stable-correlation');
    assert.equal(result.kind, 'response');
    assert.equal(attempts, 2);
    assert.equal(calls[0].url, 'https://n01-fusion.test/api/soul-mesh/relay');
    assert.equal(calls[0].authorization, 'Bearer supabase-session-token-for-test');
    assert.equal(calls[1].authorization, calls[0].authorization);
    assert.deepEqual(Object.keys(calls[0].body).sort(), ['capability', 'correlationId', 'payload', 'target']);
    assert.equal(calls[0].body.target, 'N07');
    assert.equal(calls[0].body.capability, 'mesh.ping');
    assert.equal(calls[0].body.correlationId, calls[1].body.correlationId);
    assert.equal(calls[0].body.source, undefined);
    assert.equal(calls[0].body.hmac, undefined);
    assert.equal(calls[0].body.nonce, undefined);
  } finally {
    globalThis.fetch = previousFetch;
    setSoulMeshSessionAccessTokenProvider(null);
    restoreLocation();
  }
});

test('N01 browser peer requests fail closed without an authenticated session', async () => {
  const previousFetch = globalThis.fetch;
  const restoreLocation = setTestLocation();
  let calls = 0;
  setSoulMeshSessionAccessTokenProvider(async () => null);
  globalThis.fetch = async () => { calls += 1; return new Response('{}', { status: 200 }); };
  try {
    await assert.rejects(sendTo('N04', 'mesh.ping', {}, 1000), /SOUL_MESH_BROWSER_SESSION_REQUIRED/);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = previousFetch;
    setSoulMeshSessionAccessTokenProvider(null);
    restoreLocation();
  }
});

test('N01 browser peer requests preserve the N07 structural-only boundary', async () => {
  const previousFetch = globalThis.fetch;
  const restoreLocation = setTestLocation();
  setSoulMeshSessionAccessTokenProvider(async () => 'supabase-session-token-for-test');
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return new Response('{}', { status: 200 }); };
  try {
    await assert.rejects(sendTo('N07', 'mesh.supergpu.execute@1.0.0', { values: [1] }), /N07_STRUCTURAL_CAPABILITY_ONLY/);
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = previousFetch;
    setSoulMeshSessionAccessTokenProvider(null);
    restoreLocation();
  }
});
