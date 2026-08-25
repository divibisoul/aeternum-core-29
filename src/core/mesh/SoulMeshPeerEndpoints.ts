import type { SoulNucleus } from './SoulMeshProtocol';

export const SOUL_MESH_PEER_ENDPOINTS: Record<Exclude<SoulNucleus, 'aeternum'>, { in: string; out: string }> = {
  nexus: { in: '/soul-mesh/nexus/in', out: '/soul-mesh/nexus/out' },
  eternium: { in: '/soul-mesh/eternium/in', out: '/soul-mesh/eternium/out' },
  chatbot: { in: '/soul-mesh/chatbot/in', out: '/soul-mesh/chatbot/out' },
  chatbots: { in: '/soul-mesh/chatbots/in', out: '/soul-mesh/chatbots/out' },
  'chatbot-2000': { in: '/soul-mesh/chatbot-2000/in', out: '/soul-mesh/chatbot-2000/out' },
};

export function peerEndpoint(peer: Exclude<SoulNucleus, 'aeternum'>, direction: 'in' | 'out'): string {
  return SOUL_MESH_PEER_ENDPOINTS[peer][direction];
}
