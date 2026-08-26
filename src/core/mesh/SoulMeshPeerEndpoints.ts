import type { SoulNucleus } from './SoulMeshProtocol';

export type SoulPeerDirection = 'in' | 'out';
export type SoulPeerEndpoint = { in: string; out: string; verifiedRuntimeRoute: boolean };

// Every web nucleus now exposes the same canonical receiver. The URL origin is injected
// at runtime; this file defines the protocol path only and never embeds credentials.
export const SOUL_MESH_PEER_ENDPOINTS: Record<Exclude<SoulNucleus, 'N01'>, SoulPeerEndpoint> = {
  N02: { in: '/api/soul-mesh', out: '/api/soul-mesh', verifiedRuntimeRoute: true },
  N03: { in: '/api/soul-mesh', out: '/api/soul-mesh', verifiedRuntimeRoute: true },
  N04: { in: '/api/soul-mesh', out: '/api/soul-mesh', verifiedRuntimeRoute: true },
  N05: { in: '/api/soul-mesh', out: '/api/soul-mesh', verifiedRuntimeRoute: true },
  N06: { in: '/api/soul-mesh', out: '/api/soul-mesh', verifiedRuntimeRoute: true },
};

type SoulPeerBaseUrls = Partial<Record<Exclude<SoulNucleus, 'N01'>, string>>;

declare global {
  var __SOUL_PEER_BASE_URLS__: SoulPeerBaseUrls | undefined;
}

export function peerEndpoint(peer: Exclude<SoulNucleus, 'N01'>, direction: SoulPeerDirection): string {
  return SOUL_MESH_PEER_ENDPOINTS[peer][direction];
}

export function isPeerRuntimeRouteVerified(peer: Exclude<SoulNucleus, 'N01'>): boolean {
  return SOUL_MESH_PEER_ENDPOINTS[peer].verifiedRuntimeRoute;
}

/** Resolve a reachable endpoint only when a peer origin is supplied at runtime. */
export function resolvePeerEndpoint(peer: Exclude<SoulNucleus, 'N01'>, direction: SoulPeerDirection): string {
  const path = peerEndpoint(peer, direction);
  const base = globalThis.__SOUL_PEER_BASE_URLS__?.[peer];
  if (!base) return path;
  return `${base.replace(/\/$/, '')}${path}`;
}

export function isPeerEndpointConfigured(peer: Exclude<SoulNucleus, 'N01'>): boolean {
  return Boolean(globalThis.__SOUL_PEER_BASE_URLS__?.[peer]);
}
