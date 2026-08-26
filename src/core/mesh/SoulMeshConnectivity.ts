import type { SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
import { createSoulMeshRouter } from './createSoulMeshRouter';

export const N01_PEERS: Exclude<SoulNucleus, 'N01'>[] = ['N02', 'N03', 'N04', 'N05', 'N06'];

export function createN01Mesh(transport: SoulMeshTransport) {
  return createSoulMeshRouter('N01', transport);
}

/**
 * Probes the five logical peers using a real request/response capability.
 * A peer is PASS only when the router receives a correlated response.
 */
export async function probeN01Peers(
  transport: SoulMeshTransport,
  capability = 'mesh.health',
  timeoutMs = 10000,
) {
  const router = createSoulMeshRouter('N01', transport);
  const results = await Promise.allSettled(
    N01_PEERS.map((peer) => router.request(peer, capability, { probe: true, source: 'N01' }))
  );
  router.close();
  return results.map((result, index) => ({
    peer: N01_PEERS[index],
    ok: result.status === 'fulfilled',
    error: result.status === 'rejected' ? String(result.reason) : undefined,
    timeoutMs,
  }));
}

/** Backward-compatible aliases are intentionally kept for existing callers. */
export const R1_PEERS = N01_PEERS;
export const createR1Mesh = createN01Mesh;
export const probeR1Peers = probeN01Peers;
