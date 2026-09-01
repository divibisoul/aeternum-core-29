import type { SoulNucleus } from './SoulMeshProtocol';
export type SoulMeshPeerEndpoint = { in: string; out: string };
export type RemoteSoulNucleus = Exclude<SoulNucleus, 'N01'>;
/** Runtime adapters normalize deployment URLs; these logical paths identify Mesh direction. */
export const SOUL_MESH_PEER_ENDPOINTS: Record<RemoteSoulNucleus, SoulMeshPeerEndpoint> = {
  N02: { in:'/api/soul-mesh', out:'/api/soul-mesh' },
  N03: { in:'/api/soul-mesh', out:'/api/soul-mesh' },
  N04: { in:'/api/soul-mesh', out:'/api/soul-mesh' },
  N05: { in:'/api/soul-mesh', out:'/api/soul-mesh' },
  N06: { in:'/api/soul-mesh', out:'/api/soul-mesh' },
  N07: { in:'/api/soul-mesh', out:'/api/soul-mesh' },
};
export function peerEndpoint(peer: RemoteSoulNucleus, direction:'in'|'out'){ return SOUL_MESH_PEER_ENDPOINTS[peer][direction]; }
export function allPeerEndpoints(peer: RemoteSoulNucleus){ return SOUL_MESH_PEER_ENDPOINTS[peer]; }
export function isKnownRemoteNucleus(value:unknown): value is RemoteSoulNucleus { return typeof value==='string' && value in SOUL_MESH_PEER_ENDPOINTS; }
