const nuclei = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];
const endpoint = (nucleus) => nucleus === 'N01' ? process.env.SOUL_N01_ENDPOINT : process.env[`SOUL_${nucleus}_ENDPOINT`];
const id = () => crypto.randomUUID();

function channels() {
  return nuclei.flatMap((owner) => nuclei.filter((peer) => peer !== owner).flatMap((peer) =>
    [1, 2, 3, 4, 5].flatMap((slot) => [`${owner}.OUT.${slot}.${peer}`, `${owner}.IN.${slot}.${peer}`])
  ));
}

async function probe(channelId) {
  const [, , , peer] = channelId.split('.');
  const url = endpoint(peer);
  const correlationId = id();
  if (!url) return { channelId, peer, status: 'CONFIG_MISSING', executed: false };
  const message = { protocol: 'soul-mesh/1', id: id(), correlationId, source: 'N01', target: peer, kind: 'request', capability: 'mesh.ping', channelId, payload: { probe: '60-channel-e2e' }, timestamp: Date.now() };
  try {
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(message) });
    const body = await response.json().catch(() => ({}));
    const executed = response.ok && body?.proof === 'EXECUTED' && body?.correlationId === correlationId;
    return { channelId, peer, http: response.status, proof: body?.proof ?? null, correlated: body?.correlationId === correlationId, executed };
  } catch (error) {
    return { channelId, peer, status: 'TRANSPORT_ERROR', error: error instanceof Error ? error.message : String(error), executed: false };
  }
}

const all = channels();
const results = await Promise.all(all.map(probe));
const executed = results.filter((r) => r.executed).length;
console.table(results);
console.log(`SOUL logical channel probes: ${executed}/${all.length}`);
if (all.length !== 60 || executed !== 60) process.exitCode = 2;
