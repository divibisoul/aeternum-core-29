import { SOUL_NUCLEI, SoulNucleus } from './SoulMeshProtocol';

/** Canonical seven-nucleus topology. N01 has six peers; every pair is bidirectional. */
export const SOUL_MESH_PEERS = SOUL_NUCLEI.filter(
  (nucleus): nucleus is Exclude<SoulNucleus, 'N01'> => nucleus !== 'N01',
);

export type SoulMeshPeer = typeof SOUL_MESH_PEERS[number];
export type SoulMeshDirection = 'in' | 'out';
export type SoulMeshPeerRoute = {
  peer: SoulMeshPeer;
  direction: SoulMeshDirection;
  enabled: boolean;
};

export const R1_PEER_ROUTES: SoulMeshPeerRoute[] = SOUL_MESH_PEERS.flatMap((peer) => [
  { peer, direction: 'in' as const, enabled: true },
  { peer, direction: 'out' as const, enabled: true },
]);

export function peerRoutes(peer: SoulMeshPeer): SoulMeshPeerRoute[] {
  return R1_PEER_ROUTES.filter((route) => route.peer === peer);
}

/** Six peers per nucleus -> 21 bidirectional pairs / 42 directed peer links. */
export const SOUL_MESH_DIRECTIONAL_CHANNEL_COUNT =
  (SOUL_NUCLEI.length * (SOUL_NUCLEI.length - 1));

/** Each directed peer link has one IN and one OUT endpoint. */
export const SOUL_MESH_CHANNEL_ENDPOINT_COUNT =
  SOUL_MESH_DIRECTIONAL_CHANNEL_COUNT * 2;
