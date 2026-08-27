import { IndexedDBDiscoveryAdapter } from './SoulMeshDiscoveryAdapter';
import { SoulMeshDiscoveryRegistry } from './SoulMeshDiscovery';
import { N01MeshChannelFabric } from './N01MeshChannelFabric';
import { SoulMeshRouter } from './SoulMeshRouter';
import { N01_PEERS, type N01PeerId } from './N01Channels';
import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';

const TIMEOUT_MS = 3000;

type Status = 'PASS' | 'FAIL' | 'TIMEOUT' | 'NOT_REGISTERED';
export type N01DiagnosticPeerResult = {
  peer: N01PeerId;
  registered: boolean;
  inbound: Status;
  outbound: Status;
  echo: Status;
  eventAck: Status;
  authInvalidRejected: Status;
  error?: string;
};

class FabricTransport implements SoulMeshTransport {
  private fabric?: N01MeshChannelFabric;
  bind(fabric: N01MeshChannelFabric): void { this.fabric = fabric; }
  async send(message: SoulMeshMessage): Promise<void> {
    if (!this.fabric) throw new Error('DIAGNOSTIC_FABRIC_NOT_READY');
    await this.fabric.send(message.target as N01PeerId, message);
  }
  onMessage(_handler: (message: SoulMeshMessage) => void | Promise<void>): () => void { return () => undefined; }
}

async function requestJson(url: string, init?: RequestInit, timeoutMs = TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const body = await response.json().catch(() => undefined);
    if (!response.ok) throw new Error(`HTTP_${response.status}:${JSON.stringify(body)}`);
    return body;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('TIMEOUT');
    throw error;
  } finally { window.clearTimeout(timer); }
}

function messageFor(peer: N01PeerId, token: string): SoulMeshMessage {
  const id = crypto.randomUUID();
  return {
    protocol: 'soul-mesh/1', contractVersion: '1.1.0', id, correlationId: id,
    source: peer, target: 'N01', kind: 'request', capability: 'mesh.echo',
    payload: { diagnostic: true, sentAt: Date.now() }, timestamp: Date.now(), authToken: token,
  };
}

export async function runN01BrowserDiagnostic(): Promise<{ generatedAt: string; peers: N01DiagnosticPeerResult[] }> {
  const adapter = new IndexedDBDiscoveryAdapter();
  const discovery = new SoulMeshDiscoveryRegistry(adapter);
  await discovery.hydrate();

  // Development host provisions mock peer credentials/endpoints; the browser stores them in the real IndexedDB adapter.
  for (const peer of N01_PEERS) {
    if (!discovery.resolve(peer)) {
      const registration = await requestJson(`/mesh/dev/register/${peer}`, { method: 'POST' }) as { peerId: N01PeerId; token: string; endpoint: string };
      await adapter.register({
        nucleus: peer,
        endpoint: registration.endpoint,
        capabilities: [],
        protocol: 'soul-mesh/1',
        contractVersion: '1.1.0',
        authToken: registration.token,
        registeredAt: Date.now(),
        lastSeen: Date.now(),
      });
    }
  }
  await discovery.hydrate();

  const fabricTransport = new FabricTransport();
  const router = new SoulMeshRouter(fabricTransport, 'N01', TIMEOUT_MS);
  const fabric = new N01MeshChannelFabric(router, discovery);
  fabricTransport.bind(fabric);

  const results: N01DiagnosticPeerResult[] = [];
  for (const peer of N01_PEERS) {
    const registration = discovery.resolve(peer);
    const result: N01DiagnosticPeerResult = {
      peer,
      registered: Boolean(registration),
      inbound: registration ? 'FAIL' : 'NOT_REGISTERED',
      outbound: registration ? 'FAIL' : 'NOT_REGISTERED',
      echo: registration ? 'FAIL' : 'NOT_REGISTERED',
      eventAck: registration ? 'FAIL' : 'NOT_REGISTERED',
      authInvalidRejected: registration ? 'FAIL' : 'NOT_REGISTERED',
    };
    if (!registration) { results.push(result); continue; }

    try {
      const response = await requestJson(`/mesh/in/${peer}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${registration.authToken ?? ''}` },
        body: JSON.stringify(messageFor(peer, registration.authToken ?? '')),
      });
      const message = response as SoulMeshMessage;
      result.inbound = message?.kind === 'response' && message.source === 'N01' && message.target === peer ? 'PASS' : 'FAIL';
    } catch (error) {
      result.inbound = String(error).includes('TIMEOUT') ? 'TIMEOUT' : 'FAIL';
      result.error = error instanceof Error ? error.message : String(error);
    }

    try {
      const response = await router.request(peer, 'mesh.echo', { diagnostic: true, sentAt: Date.now() });
      result.outbound = response.source === peer && response.target === 'N01' ? 'PASS' : 'FAIL';
      result.echo = result.outbound;
    } catch (error) {
      result.outbound = String(error).includes('timeout') ? 'TIMEOUT' : 'FAIL';
      result.echo = result.outbound;
    }

    try {
      const response = await router.sendEventAndWait(peer, 'mesh.diagnostic.event', { ping: true }, TIMEOUT_MS);
      result.eventAck = response.source === peer && response.target === 'N01' && response.kind === 'response' ? 'PASS' : 'FAIL';
    } catch (error) {
      result.eventAck = String(error).includes('timeout') ? 'TIMEOUT' : 'FAIL';
    }

    try {
      const invalid = messageFor(peer, 'definitely-invalid-token');
      await fetch(`/mesh/in/${peer}`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer definitely-invalid-token' }, body: JSON.stringify(invalid) }).then(response => {
        result.authInvalidRejected = response.status === 401 ? 'PASS' : 'FAIL';
      });
    } catch { result.authInvalidRejected = 'FAIL'; }

    results.push(result);
  }

  await fabric.close();
  router.close();
  const report = { generatedAt: new Date().toISOString(), peers: results };
  console.log('N01 5x5 Mesh diagnostic', report);
  return report;
}
