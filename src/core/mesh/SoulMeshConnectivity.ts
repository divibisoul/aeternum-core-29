import type { SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
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
      const raw = payload.capabilities ?? payload.declaredCapabilities ?? payload.executableCapabilities;
      const capabilities = Array.isArray(raw) ? raw.map(String) : [];
      const updated = registry.updateCapabilities(peer, capabilities, typeof payload.contractVersion === 'string' ? payload.contractVersion : undefined);
      return { peer, discovered: capabilities, registered: Boolean(updated) };
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
