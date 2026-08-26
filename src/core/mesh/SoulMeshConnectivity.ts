import type { SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
import { createSoulMeshRouter } from './createSoulMeshRouter';

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
