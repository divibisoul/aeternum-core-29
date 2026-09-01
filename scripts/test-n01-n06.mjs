import crypto from 'node:crypto';

const n01 = process.env.SOUL_MESH_N01_URL || `http://127.0.0.1:${process.env.SOUL_MESH_N01_PORT || 8080}`;
const n06 = process.env.SOUL_MESH_N06_URL;
const secret = process.env.SOUL_MESH_SECRET || '';
const CONTRACT_VERSION = '1.1.0';

function unsigned(e) {
  const { hmac, ...rest } = e;
  return JSON.stringify(rest);
}

function makeEnvelope(target, capability, payload = {}) {
  const base = {
    version: '1.0',
    contractVersion: CONTRACT_VERSION,
    messageId: crypto.randomUUID(),
    source: 'N01',
    target,
    timestamp: Date.now(),
    nonce: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    type: 'CAPABILITY_REQUEST',
    payload: { capability, payload },
  };
  return {
    ...base,
    hmac: secret ? crypto.createHmac('sha256', secret).update(unsigned(base)).digest('hex') : '',
  };
}

async function post(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-correlation-id': body.correlationId,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

const health = await fetch(`${n01.replace(/\/$/, '')}/mesh/health`);
const healthBody = await health.json();
if (!health.ok || healthBody.nucleus !== 'N01') throw new Error(`N01 health failed: ${health.status}`);
console.log(JSON.stringify({ stage: 'N01_HEALTH', ok: true, peers: healthBody.peers?.map((p) => p.id) || [] }, null, 2));

if (!n06) throw new Error('SOUL_MESH_N06_URL not configured; canonical N01-N06 E2E cannot be claimed in CI');

const message = makeEnvelope('N06', 'mesh.ping', { probe: 'N01-N06' });
const result = await post(`${n06.replace(/\/$/, '')}/api/soul-mesh`, {
  protocol: 'soul-mesh/1',
  contractVersion: CONTRACT_VERSION,
  id: message.messageId,
  correlationId: message.correlationId,
  source: message.source,
  target: message.target,
  kind: 'request',
  capability: 'mesh.ping',
  payload: message.payload.payload,
  timestamp: message.timestamp,
});

if (result.status < 200 || result.status >= 300) {
  throw new Error(`N01-N06 capability failed: HTTP ${result.status} ${JSON.stringify(result.data)}`);
}
for (const [field, expected] of [
  ['source', 'N06'],
  ['target', 'N01'],
  ['correlationId', message.correlationId],
  ['contractVersion', CONTRACT_VERSION],
]) {
  if (result.data?.[field] !== expected) {
    throw new Error(`N01-N06 ${field} mismatch: expected ${expected}, got ${result.data?.[field]}`);
  }
}

console.log(JSON.stringify({
  stage: 'N01_N06_E2E',
  ok: true,
  source: result.data.source,
  target: result.data.target,
  capability: result.data.capability,
  contractVersion: result.data.contractVersion,
  correlationId: result.data.correlationId,
}, null, 2));
