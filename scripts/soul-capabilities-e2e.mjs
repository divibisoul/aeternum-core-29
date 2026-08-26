import crypto from 'node:crypto';

const NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];
const PROTOCOL = 'soul-mesh/1';
const TIMEOUT_MS = Number(process.env.SOUL_E2E_TIMEOUT_MS ?? 10000);
const urls = Object.fromEntries(NUCLEI.map((n) => [n, process.env[`SOUL_${n}_ENDPOINT`] ?? '']).filter(([, url]) => url));

function requiredEndpoints() {
  const missing = NUCLEI.filter((n) => !urls[n]);
  if (missing.length) throw new Error(`Missing runtime endpoints: ${missing.join(', ')}. Capability E2E refuses to simulate missing runtimes.`);
}

async function post(target, source, capability, payload = {}) {
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
        capability,
        payload,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    const latencyMs = Math.round(performance.now() - started);
    const valid = response.ok && body.correlationId === correlationId && body.proof === 'EXECUTED' && body.nucleus === target;
    return { source, target, capability, correlationId, status: response.status, valid, latencyMs, body };
  } finally { clearTimeout(timer); }
}

async function discover(target) {
  return post(target, 'N01', 'mesh.capabilities', { discovery: true });
}

requiredEndpoints();
const results = [];
for (const target of NUCLEI) {
  const discovery = await discover(target);
  results.push(discovery);
  if (!discovery.valid) continue;
  const capabilities = Array.isArray(discovery.body.capabilities) ? discovery.body.capabilities : [];
  for (const capability of capabilities) {
    // Only invoke universally safe mesh capabilities automatically. Domain capabilities
    // are inventoried here and require a declared execution contract before invocation.
    if (capability === 'mesh.ping' || capability === 'mesh.health') {
      results.push(await post(target, 'N01', capability, { e2e: true }));
    }
  }
}

const failed = results.filter((r) => !r.valid);
console.log(JSON.stringify({ protocol: PROTOCOL, mode: 'REAL_RUNTIME_E2E', nuclei: NUCLEI, results, passed: results.length - failed.length, failed: failed.length, verified: failed.length === 0 }, null, 2));
if (failed.length) process.exitCode = 1;
