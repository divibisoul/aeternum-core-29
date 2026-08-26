import type { SoulNucleus } from './SoulMeshProtocol';

export type SoulPeerDirection = 'in' | 'out';
export type SoulPeerEndpoint = { in: string; out: string };

export const SOUL_MESH_PEER_ENDPOINTS: Record<Exclude<SoulNucleus, 'N01'>, SoulPeerEndpoint> = {
  N02: { in: '/soul-mesh/N02/in', out: '/soul-mesh/N02/out' },
  N03: { in: '/soul-mesh/N03/in', out: '/soul-mesh/N03/out' },
  N04: { in: '/soul-mesh/N04/in', out: '/soul-mesh/N04/out' },
  N05: { in: '/soul-mesh/N05/in', out: '/soul-mesh/N05/out' },
  N06: { in: '/soul-mesh/N06/in', out: '/soul-mesh/N06/out' },
};

type SoulPeerBaseUrls = Partial<Record<Exclude<SoulNucleus, 'N01'>, string>>;

declare global {
  // Optional runtime injection for hybrid APK/web deployments.
  // It deliberately contains no secrets; it only supplies reachable peer origins.
  var __SOUL_PEER_BASE_URLS__: SoulPeerBaseUrls | undefined;
}

export function peerEndpoint(peer: Exclude<SoulNucleus, 'N01'>, direction: SoulPeerDirection): string {
  return SOUL_MESH_PEER_ENDPOINTS[peer][direction];
}

/**
 * Resolve a logical endpoint for a hybrid deployment without changing channel identity.
 * If no peer origin is configured, the logical relative endpoint is returned unchanged.
 */
export function resolvePeerEndpoint(peer: Exclude<SoulNucleus, 'N01'>, direction: SoulPeerDirection): string {
  const path = peerEndpoint(peer, direction);
  const base = globalThis.__SOUL_PEER_BASE_URLS__?.[peer];
  if (!base) return path;
  return `${base.replace(/\/$/, '')}${path}`;
}

export function isPeerEndpointConfigured(peer: Exclude<SoulNucleus, 'N01'>): boolean {
  return Boolean(globalThis.__SOUL_PEER_BASE_URLS__?.[peer]);
}
