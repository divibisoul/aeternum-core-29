const PEERS = ['N02', 'N03', 'N04', 'N05', 'N06'];
const TIMEOUT_MS = 3000;
const peerConfig = JSON.parse(process.env.SOUL_MESH_PEERS_JSON ?? '{}');

function timeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms)),
  ]);
}

function messageFor(source, target, kind, capability, payload) {
  const id = crypto.randomUUID();
  return {
    protocol: 'soul-mesh/1',
    contractVersion: process.env.SOUL_MESH_CONTRACT_VERSION ?? '1.1.0',
    id,
    correlationId: id,
    source,
    target,
    kind,
    capability,
    payload,
    timestamp: Date.now(),
  };
}

async function post(endpoint, message, token) {
  const headers = {
    'content-type': 'application/json',
    accept: 'application/json',
    'x-soul-mesh-contract-version': message.contractVersion,
  };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(message) });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const text = await response.text();
  if (!text) return null;
  return JSON.parse(text);
}

async function checkPeer(peer) {
  const config = peerConfig[peer];
  if (!config?.endpoint) {
    return { peer, inbound: 'NOT_REGISTERED', outbound: 'NOT_REGISTERED', echo: 'NOT_REGISTERED', eventAck: 'NOT_REGISTERED' };
  }

  const base = String(config.endpoint).replace(/\/$/, '');
  const token = config.token;
  const result = { peer, inbound: 'NOT_REGISTERED', outbound: 'FAIL', echo: 'FAIL', eventAck: 'FAIL' };

  try {
    const echo = messageFor('N01', peer, 'request', 'mesh.echo', { probe: true, sentAt: Date.now() });
    const response = await timeout(post(`${base}/mesh/in/N01`, echo, token), TIMEOUT_MS);
    if (response?.kind === 'response' && response.source === peer && response.target === 'N01' && response.correlationId === echo.correlationId) {
      result.outbound = 'PASS';
      result.echo = 'PASS';
    }
  } catch (error) {
    result.outbound = String(error).includes('TIMEOUT') ? 'TIMEOUT' : 'FAIL';
    result.echo = result.outbound;
  }

  try {
    const event = messageFor('N01', peer, 'event', 'mesh.diagnostic.event', { ping: true });
    const response = await timeout(post(`${base}/mesh/in/N01`, event, token), TIMEOUT_MS);
    if (response?.kind === 'response' && response.source === peer && response.target === 'N01' && response.correlationId === event.correlationId) {
      result.eventAck = 'PASS';
    }
  } catch (error) {
    result.eventAck = String(error).includes('TIMEOUT') ? 'TIMEOUT' : 'FAIL';
  }

  // N01 inbound endpoints are provided by the active host adapter. They cannot be
  // reached by this standalone process until the Android/server ingress binds them.
  result.inbound = 'NOT_REGISTERED';
  return result;
}

const peers = {};
for (const peer of PEERS) peers[peer] = await checkPeer(peer);

const report = {
  generatedAt: new Date().toISOString(),
  local: 'N01',
  protocol: 'soul-mesh/1',
  timeoutMs: TIMEOUT_MS,
  peers,
};

process.stdout.write(JSON.stringify(report, null, 2) + '\n');
