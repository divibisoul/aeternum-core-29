const nuclei = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];
const peers = nuclei.filter((n) => n !== 'N01');
const endpoints = Object.fromEntries(peers.map((n) => [n, process.env[`SOUL_${n}_ENDPOINT` || `SOUL_${n}_ENDPOINT`]]));

const id = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function probe(target) {
  const endpoint = endpoints[target];
  if (!endpoint) return { target, status: 'CONFIG_MISSING' };
  const correlationId = id();
  const message = {
    protocol: 'soul-mesh/1', id: id(), correlationId, source: 'N01', target,
    kind: 'request', capability: 'mesh.health', payload: { probe: true }, timestamp: new Date().toISOString(),
    channelId: `N01.OUT.${target}`, transport: 'HTTP', proof: 'NEGOTIATING',
  };
  const started = Date.now();
  try {
    const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(message) });
    const body = await response.json().catch(() => null);
    const executed = body?.proof === 'EXECUTED' && body?.correlationId === correlationId;
    return { target, http: response.status, ms: Date.now() - started, executed, responseProof: body?.proof ?? null, correlation: body?.correlationId === correlationId };
  } catch (error) {
    return { target, status: 'TRANSPORT_ERROR', error: error instanceof Error ? error.message : String(error) };
  }
}

const results = await Promise.all(peers.map(probe));
console.table(results);
if (results.some((r) => r.executed !== true)) process.exitCode = 2;
