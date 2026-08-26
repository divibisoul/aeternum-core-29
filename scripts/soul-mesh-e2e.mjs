const nuclei = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];
const peers = nuclei.filter((n) => n !== 'N01');
const endpointFor = (n) => process.env[`SOUL_${n}_ENDPOINT`];

const expectedPeerPairs = [];
for (const source of nuclei) {
  for (const target of nuclei) {
    if (source !== target) expectedPeerPairs.push({ source, target });
  }
}

if (expectedPeerPairs.length !== 30) throw new Error(`Topology error: ${expectedPeerPairs.length} peer pairs`);

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function probe(target) {
  const endpoint = endpointFor(target);
  if (!endpoint) return { target, status: 'CONFIG_MISSING', executed: false };

  const correlationId = makeId();
  const message = {
    protocol: 'soul-mesh/1', id: makeId(), correlationId, source: 'N01', target,
    kind: 'request', capability: 'mesh.capabilities', payload: {}, timestamp: new Date().toISOString(),
    channelId: `${target}.IN.N01`, transport: 'HTTP', proof: 'NEGOTIATING',
  };
  const started = Date.now();
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.SOUL_MESH_TOKEN ? { authorization: `Bearer ${process.env.SOUL_MESH_TOKEN}` } : {}),
      },
      body: JSON.stringify(message),
    });
    const body = await response.json().catch(() => null);
    const correlation = body?.correlationId === correlationId;
    const executed = body?.proof === 'EXECUTED';
    return {
      target,
      http: response.status,
      ms: Date.now() - started,
      executed,
      correlation,
      proof: body?.proof ?? null,
      capabilities: Array.isArray(body?.payload?.capabilities) ? body.payload.capabilities.length : 0,
    };
  } catch (error) {
    return { target, status: 'TRANSPORT_ERROR', error: error instanceof Error ? error.message : String(error), executed: false };
  }
}

const results = await Promise.all(peers.map(probe));
const verifiedInbound = results.filter((r) => r.executed === true && r.correlation === true).length;

console.log(JSON.stringify({
  topology: { nuclei: 6, peerPairs: 30, directionalChannels: 60 },
  n01InboundProbes: results,
  verifiedInboundProbes: verifiedInbound,
  note: 'This harness verifies live execution only when deployment endpoints are configured. Missing configuration is not treated as success.',
}, null, 2));

if (results.some((r) => r.executed !== true || r.correlation !== true)) process.exitCode = 2;
