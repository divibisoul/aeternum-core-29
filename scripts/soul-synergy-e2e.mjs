import crypto from 'node:crypto';

const NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];
const PROTOCOL = 'soul-mesh/1';
const TIMEOUT_MS = Number(process.env.SOUL_E2E_TIMEOUT_MS ?? 10000);
const urls = Object.fromEntries(NUCLEI.map((n) => [n, process.env[`SOUL_${n}_ENDPOINT`] ?? '']).filter(([, url]) => url));
const peers = NUCLEI.flatMap((source) => NUCLEI.filter((target) => target !== source).map((target) => [source, target]));

if (NUCLEI.some((n) => !urls[n])) {
  const missing = NUCLEI.filter((n) => !urls[n]);
  throw new Error(`Missing runtime endpoints: ${missing.join(', ')}. Synergy E2E refuses to emulate a nucleus.`);
}

async function transmit(source, target, previous = null) {
  const correlationId = crypto.randomUUID();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = performance.now();
  try {
    const response = await fetch(urls[target], {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        protocol: PROTOCOL,
        source,
        target,
        channelId: `${source}.OUT.1.${target}`,
        correlationId,
        capability: 'mesh.ping',
        payload: { synergyE2E: true, previousCorrelationId: previous },
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    return {
      source,
      target,
      correlationId,
      latencyMs: Math.round(performance.now() - started),
      valid: response.ok && body.nucleus === target && body.correlationId === correlationId && body.proof === 'EXECUTED',
      body,
    };
  } finally { clearTimeout(timer); }
}

// Every directed peer link is exercised. In addition, a deterministic six-hop ring
// proves that results can cross multiple different nuclei without requiring Pilot as a relay.
const directed = await Promise.all(peers.map(([source, target]) => transmit(source, target)));
const ring = [];
for (let i = 0; i < NUCLEI.length; i++) {
  const source = NUCLEI[i];
  const target = NUCLEI[(i + 1) % NUCLEI.length];
  ring.push(await transmit(source, target, ring.at(-1)?.correlationId ?? null));
}

const failed = [...directed, ...ring].filter((r) => !r.valid);
console.log(JSON.stringify({ protocol: PROTOCOL, mode: 'REAL_RUNTIME_SYNERGY_E2E', directedLinks: directed.length, ringHops: ring.length, directed, ring, passed: directed.length + ring.length - failed.length, failed: failed.length, verified: failed.length === 0 }, null, 2));
if (failed.length) process.exitCode = 1;
