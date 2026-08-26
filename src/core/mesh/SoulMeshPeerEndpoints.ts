import type { SoulNucleus } from './SoulMeshProtocol';

export type SoulMeshPeerEndpoint = { in: string; out: string };
export type RemoteSoulNucleus = Exclude<SoulNucleus, 'N01'>;

/** Logical paths only. Existence of a path is not proof of deployment. */
export const SOUL_MESH_PEER_ENDPOINTS: Record<RemoteSoulNucleus, SoulMeshPeerEndpoint> = {
  N02: { in: '/soul-mesh/N02/in', out: '/soul-mesh/N02/out' },
  N03: { in: '/soul-mesh/N03/in', out: '/soul-mesh/N03/out' },
  N04: { in: '/soul-mesh/N04/in', out: '/soul-mesh/N04/out' },
  N05: { in: '/soul-mesh/N05/in', out: '/soul-mesh/N05/out' },
  N06: { in: '/soul-mesh/N06/in', out: '/soul-mesh/N06/out' },
};

export function peerEndpoint(peer: RemoteSoulNucleus, direction: 'in' | 'out'): string {
  return SOUL_MESH_PEER_ENDPOINTS[peer][direction];
}
