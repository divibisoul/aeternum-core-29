const nuclei = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];
const remote = nuclei.filter((n) => n !== 'N01');
const id = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function probe(source, target) {
  const endpoint = process.env[`SOUL_${target}_ENDPOINT`];
  if (!endpoint) return { source, target, channel: `${source}.OUT.${target}`, status: 'CONFIG_MISSING' };
  const correlationId = id();
  const message = { protocol: 'soul-mesh/1', id: id(), correlationId, source, target, kind: 'request', capability: 'mesh.health', payload: { probe: true }, timestamp: new Date().toISOString(), channelId: `${source}.OUT.${target}`, transport: 'HTTP', proof: 'NEGOTIATING' };
  try {
    const r = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(message) });
    const body = await r.json().catch(() => null);
    return { source, target, channel: message.channelId, http: r.status, proof: body?.proof ?? null, correlation: body?.correlationId === correlationId, executed: body?.proof === 'EXECUTED' && body?.correlationId === correlationId };
  } catch (e) {
    return { source, target, channel: message.channelId, status: 'TRANSPORT_ERROR', error: e instanceof Error ? e.message : String(e) };
  }
}

const directed = [];
for (const target of remote) for (const source of nuclei.filter((n) => n !== target)) directed.push([source, target]);
const results = await Promise.all(directed.map(([source, target]) => probe(source, target)));
console.table(results);
const executed = results.filter((r) => r.executed === true).length;
console.log(`Remote inbound probes executed: ${executed}/${results.length}`);
if (results.some((r) => r.executed !== true)) process.exitCode = 2;
