import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';

const SELF = 'N01';
const PEERS = ['N02', 'N03', 'N04', 'N05', 'N06', 'N07'];
const PROTOCOL = 'soul-mesh/1';
const CONTRACT_VERSION = '1.1.0';
const raw = process.env.SOUL_FUSION_PEERS || '{}';
const timeoutMs = Math.min(30_000, Math.max(1_000, Number(process.env.SOUL_FUSION_CHECK_TIMEOUT_MS || 5000)));
let configured;
try { configured = JSON.parse(raw); } catch { throw new Error('SOUL_FUSION_PEERS_INVALID_JSON'); }
if (!configured || typeof configured !== 'object' || Array.isArray(configured)) throw new Error('SOUL_FUSION_PEERS_INVALID_SHAPE');

function urlFor(id) {
  const value = configured?.[id];
  return typeof value === 'string' ? value.replace(/\/$/, '') : (value && typeof value.url === 'string' ? value.url.replace(/\/$/, '') : '');
}
function request(target, capability, payload = {}) {
  const id = randomUUID();
  return { protocol: PROTOCOL, contractVersion: CONTRACT_VERSION, id, correlationId: id, source: SELF, target, kind: 'request', capability, payload, timestamp: Date.now() };
}

const results = [];
for (const peer of PEERS) {
  const base = urlFor(peer);
  if (!base) { results.push({ peer, status: 'not-configured' }); continue; }
  if (!/^https?:\/\//i.test(base)) { results.push({ peer, status: 'invalid-endpoint' }); continue; }
  const message = request(peer, 'mesh.ping');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}/api/soul-mesh`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-soul-mesh-contract': CONTRACT_VERSION }, body: JSON.stringify(message), signal: controller.signal, cache: 'no-store' });
    const body = await response.json().catch(() => null);
    const ok = response.ok && body?.protocol === PROTOCOL && body?.contractVersion === CONTRACT_VERSION && body?.correlationId === message.correlationId && body?.source === peer && body?.target === SELF;
    results.push({ peer, status: ok ? 'reachable' : 'invalid-response', http: response.status });
  } catch (error) {
    results.push({ peer, status: error?.name === 'AbortError' ? 'timeout' : 'unreachable', error: error instanceof Error ? error.message : String(error) });
  } finally { clearTimeout(timer); }
  await sleep(25);
}

const reachable = results.filter((r) => r.status === 'reachable').length;
console.log(JSON.stringify({ system: 'SOUL', nucleus: SELF, protocol: PROTOCOL, contractVersion: CONTRACT_VERSION, peers: results, reachable, totalPeers: PEERS.length, structuralContract: { nuclei: 7, peersPerNucleus: 6, directionalChannels: 42, transports: 5 } }, null, 2));
if (process.env.SOUL_FUSION_REQUIRE_ALL === 'true' && reachable !== PEERS.length) process.exitCode = 2;
