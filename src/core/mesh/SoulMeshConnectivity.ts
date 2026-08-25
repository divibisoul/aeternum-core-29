import type { SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
import { createSoulMeshRouter } from './createSoulMeshRouter';

export const R1_PEERS: SoulNucleus[] = ['nexus', 'eternium', 'chatbot', 'chatbots', 'chatbot-2000'];

export function createR1Mesh(transport: SoulMeshTransport) {
  return createSoulMeshRouter('aeternum', transport);
}

export async function probeR1Peers(transport: SoulMeshTransport, capability = 'conversation') {
  const router = createR1Mesh(transport);
  const results = await Promise.allSettled(R1_PEERS.map((peer) => router.request(peer, capability, { probe: true })));
  router.close();
  return results.map((result, index) => ({ peer: R1_PEERS[index], ok: result.status === 'fulfilled', error: result.status === 'rejected' ? String(result.reason) : undefined }));
}
