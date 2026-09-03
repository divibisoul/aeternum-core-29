import { randomUUID } from 'node:crypto';

const PEERS = ['N02', 'N03', 'N04', 'N05', 'N06', 'N07'];
const TIMEOUT_MS = 3000;
const peerConfigRaw = process.env.SOUL_MESH_PEERS_JSON ?? '{}';
let peerConfig;
try {
  peerConfig = JSON.parse(peerConfigRaw);
} catch {
  throw new Error('SOUL_MESH_PEERS_INVALID_JSON');
}
if (!peerConfig || typeof peerConfig !== 'object' || Array.isArray(peerConfig)) throw new Error('SOUL_MESH_PEERS_INVALID_SHAPE');

function messageFor(source, target, kind, capability, payload) {
  const id = randomUUID();
  return { protocol: 'soul-mesh/1', contractVersion: process.env.SOUL_MESH_CONTRACT_VERSION ?? '1.1.0', id, correlationId: id, source, target, kind, capability, payload, timestamp: Date.now() };
}

async function post(endpoint, message, token, signal) {
  const headers = { 'content-type': 'application/json', accept: 'application/json', 'x-soul-mesh-contract-version': message.contractVersion };
  if (token) headers.authorization = `Bearer ${token}`;
  if (!/^https?:\/\//i.test(endpoint)) throw new Error('INVALID_PEER_ENDPOINT');
  const response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(message), signal });
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function checkPeer(peer) {
  const config = peerConfig[peer];
  if (!config?.endpoint) return { peer, outbound: 'NOT_CONFIGURED', echo: 'NOT_CONFIGURED', eventAck: 'NOT_CONFIGURED' };
  const base = String(config.endpoint).replace(/\/$/, '');
  const result = { peer, outbound: 'FAIL', echo: 'FAIL', eventAck: 'FAIL' };
  for (const probe of [
    { field: 'outbound', kind: 'request', capability: 'mesh.echo', payload: { probe: true, sentAt: Date.now() } },
    { field: 'eventAck', kind: 'event', capability: 'mesh.diagnostic.event', payload: { ping: true } },
  ]) {
    const message = messageFor('N01', peer, probe.kind, probe.capability, probe.payload);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await post(`${base}/mesh/in/N01`, message, config.token, controller.signal);
      const valid = response?.kind === 'response' && response.source === peer && response.target === 'N01' && response.correlationId === message.correlationId;
      result[probe.field] = valid ? 'PASS' : 'FAIL';
      if (probe.field === 'outbound') result.echo = result.outbound;
    } catch (error) {
      result[probe.field] = error?.name === 'AbortError' ? 'TIMEOUT' : 'FAIL';
      if (probe.field === 'outbound') result.echo = result.outbound;
    } finally {
      clearTimeout(timer);
    }
  }
  return result;
}

const peers = Object.fromEntries(await Promise.all(PEERS.map(async (peer) => [peer, await checkPeer(peer)])));
const statuses = Object.values(peers).flatMap((entry) => [entry.outbound, entry.echo, entry.eventAck]);
const report = { generatedAt: new Date().toISOString(), local: 'N01', protocol: 'soul-mesh/1', peers, pass: statuses.length > 0 && statuses.every((status) => status === 'PASS') };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (!report.pass) process.exitCode = 1;
