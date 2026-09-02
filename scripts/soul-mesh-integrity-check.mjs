import { setTimeout as sleep } from 'node:timers/promises';

const SELF = 'N01';
const PEERS = ['N02', 'N03', 'N04', 'N05', 'N06', 'N07'];
const PROTOCOL = 'soul-mesh/1';
const CONTRACT = '1.1.0';
const raw = process.env.SOUL_MESH_PEERS || process.env.SOUL_FUSION_PEERS || '{}';
let configured;
try { configured = JSON.parse(raw); } catch { throw new Error('SOUL_MESH_PEERS_INVALID_JSON'); }

function urlFor(id) {
  const value = configured?.[id];
  return typeof value === 'string' ? value.replace(/\/$/, '') : (value && typeof value.url === 'string' ? value.url.replace(/\/$/, '') : '');
}
function request(target, capability, payload = {}) {
  const correlationId = crypto.randomUUID();
  return { protocol: PROTOCOL, contractVersion: CONTRACT, id: crypto.randomUUID(), correlationId, source: SELF, target, kind: 'request', capability, payload, timestamp: Date.now(), meta: { runtime: 'aeternum-core-29', transport: 'HTTP', encoding: 'json', version: CONTRACT, traceId: correlationId, nonce: crypto.randomUUID().replaceAll('-', '').slice(0, 32) } };
}
async function probe(peer, capability) {
  const base = urlFor(peer);
  if (!base) return { peer, capability, status: 'not-configured' };
  const message = request(peer, capability);
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.SOUL_MESH_CHECK_TIMEOUT_MS || 5000));
  try {
    const response = await fetch(`${base}/api/soul-mesh`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-soul-correlation-id': message.correlationId }, body: JSON.stringify(message), signal: controller.signal, cache: 'no-store' });
    const body = await response.json().catch(() => null);
    const valid = body?.protocol === PROTOCOL && body?.contractVersion === CONTRACT && body?.correlationId === message.correlationId && body?.source === peer && body?.target === SELF;
    return { peer, capability, status: response.ok && valid ? 'healthy' : 'invalid-response', http: response.status, latencyMs: Date.now() - started, correlationId: message.correlationId };
  } catch (error) {
    return { peer, capability, status: 'unreachable', latencyMs: Date.now() - started, error: error instanceof Error ? error.message : String(error) };
  } finally { clearTimeout(timer); }
}

const results = [];
for (const peer of PEERS) {
  for (const capability of ['mesh.ping', 'mesh.health', 'mesh.describe']) {
    results.push(await probe(peer, capability));
    await sleep(25);
  }
}
const checked = results.filter(r => r.status !== 'not-configured');
const healthy = checked.filter(r => r.status === 'healthy').length;
const report = { system: 'SOUL', nucleus: SELF, protocol: PROTOCOL, contractVersion: CONTRACT, generatedAt: new Date().toISOString(), checks: results, summary: { healthy, checked: checked.length, configuredPeers: new Set(checked.map(r => r.peer)).size, totalPeers: PEERS.length } };
console.log(JSON.stringify(report, null, 2));
if (process.env.SOUL_MESH_REQUIRE_ALL === 'true' && (healthy !== checked.length || checked.length !== PEERS.length * 3)) process.exitCode = 2;
