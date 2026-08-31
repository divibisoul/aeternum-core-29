import type { SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
import { SOUL_MESH_CONTRACT_VERSION } from './SoulMeshProtocol';
import { createSoulMeshRouter } from './createSoulMeshRouter';
import { SoulMeshDiscoveryRegistry } from './SoulMeshDiscovery';

export const R1_PEERS: Exclude<SoulNucleus, 'N01'>[] = ['N02', 'N03', 'N04', 'N05', 'N06'];

export function createR1Mesh(transport: SoulMeshTransport) {
  return createSoulMeshRouter('N01', transport);
}

/** A peer is healthy only when a real correlated response is received. */
export async function probeR1Peers(transport: SoulMeshTransport, capability = 'mesh.health') {
  const router = createR1Mesh(transport);
  try {
    const results = await Promise.allSettled(R1_PEERS.map(async (peer) => {
      const response = await router.request(peer, capability, { probe: true, requestedBy: 'N01' });
      return { peer, ok: response.kind === 'response', response };
    }));
    return results.map((result, index) => result.status === 'fulfilled'
      ? result.value
      : { peer: R1_PEERS[index], ok: false, error: String(result.reason) });
  } finally {
    router.close();
  }
}

/** Refreshes N01's existing peer registrations from each peer's real mesh.describe response. */
export async function syncR1Capabilities(transport: SoulMeshTransport, registry: SoulMeshDiscoveryRegistry) {
  const router = createR1Mesh(transport);
  try {
    return await Promise.allSettled(R1_PEERS.map(async (peer) => {
      const response = await router.request(peer, 'mesh.describe', { requestedBy: 'N01' });
      if (response.kind !== 'response') throw new Error(`DISCOVERY_FAILED:${peer}`);
      const payload = response.payload as Record<string, unknown>;
      if (payload.contractVersion !== SOUL_MESH_CONTRACT_VERSION) {
        throw new Error(`DISCOVERY_CONTRACT_MISMATCH:${peer}`);
      }
      const raw = payload.capabilities ?? payload.declaredCapabilities ?? payload.executableCapabilities;
      if (!Array.isArray(raw)) throw new Error(`DISCOVERY_CAPABILITIES_MISSING:${peer}`);
      const capabilities = raw.map(String).filter(Boolean);
      const transports = Array.isArray(payload.transports) ? payload.transports.map(String).filter(Boolean) : undefined;
      const channels = payload.channels && typeof payload.channels === 'object' ? payload.channels as Record<string, unknown> : undefined;
      const updated = registry.updateCapabilities(peer, capabilities, SOUL_MESH_CONTRACT_VERSION, { transports, channels });
      if (!updated) throw new Error(`DISCOVERY_PEER_NOT_REGISTERED:${peer}`);
      return { peer, discovered: capabilities, transports, registered: true };
    }));
  } finally {
    router.close();
  }
}

/** Optional periodic discovery. Disabled unless VITE_SOUL_MESH_DISCOVERY_SYNC_ENABLED=true. */
export function startR1CapabilityDiscovery(transport: SoulMeshTransport, registry: SoulMeshDiscoveryRegistry, intervalMs = 60_000): () => void {
  if (import.meta.env.VITE_SOUL_MESH_DISCOVERY_SYNC_ENABLED !== 'true') return () => undefined;
  let stopped = false;
  const run = async () => { if (!stopped) await syncR1Capabilities(transport, registry).catch(() => undefined); };
  void run();
  const timer = setInterval(() => { void run(); }, Math.max(10_000, intervalMs));
  return () => { stopped = true; clearInterval(timer); };
}
