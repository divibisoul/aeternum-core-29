import { setTimeout as sleep } from 'node:timers/promises';

const SELF = 'N01';
const PEERS = ['N02', 'N03', 'N04', 'N05', 'N06', 'N07'];
const PROTOCOL = 'soul-mesh/1';
const raw = process.env.SOUL_FUSION_PEERS || '{}';
let configured;
try { configured = JSON.parse(raw); } catch { throw new Error('SOUL_FUSION_PEERS_INVALID_JSON'); }

function urlFor(id) {
  const value = configured?.[id];
  return typeof value === 'string' ? value.replace(/\/$/, '') : (value && typeof value.url === 'string' ? value.url.replace(/\/$/, '') : '');
}
function request(target, capability, payload = {}) {
  return { protocol: PROTOCOL, id: crypto.randomUUID(), correlationId: crypto.randomUUID(), source: SELF, target, kind: 'request', capability, payload, timestamp: Date.now() };
}

const results = [];
for (const peer of PEERS) {
  const base = urlFor(peer);
  if (!base) { results.push({ peer, status: 'not-configured' }); continue; }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.SOUL_FUSION_CHECK_TIMEOUT_MS || 5000));
  try {
    const response = await fetch(`${base}/api/soul-mesh`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request(peer, 'mesh.ping')), signal: controller.signal, cache: 'no-store' });
    const body = await response.json().catch(() => null);
    const ok = response.ok && body?.protocol === PROTOCOL && body?.correlationId;
    results.push({ peer, status: ok ? 'reachable' : 'invalid-response', http: response.status });
  } catch (error) {
    results.push({ peer, status: 'unreachable', error: error instanceof Error ? error.message : String(error) });
  } finally { clearTimeout(timer); }
  await sleep(25);
}

const reachable = results.filter((r) => r.status === 'reachable').length;
console.log(JSON.stringify({ system: 'SOUL', nucleus: SELF, protocol: PROTOCOL, peers: results, reachable, totalPeers: PEERS.length, structuralContract: { nuclei: 7, peersPerNucleus: 6, directionalChannels: 42, transports: 5 } }, null, 2));
if (process.env.SOUL_FUSION_REQUIRE_ALL === 'true' && reachable !== PEERS.length) process.exitCode = 2;
