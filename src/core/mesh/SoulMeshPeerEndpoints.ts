import type { SoulNucleus } from './SoulMeshProtocol';

export type SoulPeerDirection = 'in' | 'out';
export type SoulPeerEndpoint = { in: string; out: string; verifiedRuntimeRoute: boolean };

// Logical channel identities are fixed. Runtime paths are only marked verified when the
// corresponding destination route has been inspected in its repository.
export const SOUL_MESH_PEER_ENDPOINTS: Record<Exclude<SoulNucleus, 'N01'>, SoulPeerEndpoint> = {
  N02: { in: '/soul-mesh/N02/in', out: '/soul-mesh/N02/out', verifiedRuntimeRoute: false },
  N03: { in: '/soul-mesh/N03/in', out: '/soul-mesh/N03/out', verifiedRuntimeRoute: false },
  N04: { in: '/soul-mesh/N04/in', out: '/soul-mesh/N04/out', verifiedRuntimeRoute: false },
  // Verified in the N05 repository: Next.js app/api/soul-mesh/route.ts.
  N05: { in: '/api/soul-mesh', out: '/api/soul-mesh', verifiedRuntimeRoute: true },
  N06: { in: '/soul-mesh/N06/in', out: '/soul-mesh/N06/out', verifiedRuntimeRoute: false },
};

type SoulPeerBaseUrls = Partial<Record<Exclude<SoulNucleus, 'N01'>, string>>;

declare global {
  // Optional runtime injection for hybrid APK/web deployments.
  // It contains origins only; credentials belong in the authenticated transport/session.
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
