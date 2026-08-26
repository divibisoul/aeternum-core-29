import type { SoulNucleus } from './SoulMeshProtocol';

/**
 * Runtime endpoint registry for N01.
 *
 * Logical nucleus identity is canonical (N01..N06); transport-specific URLs
 * are deployment configuration and are never used as nucleus identifiers.
 */
export type SoulMeshEndpoint = {
  in?: string;
  out?: string;
};

export const SOUL_MESH_PEER_ENDPOINTS: Record<Exclude<SoulNucleus, 'N01'>, SoulMeshEndpoint> = {
  N02: {},
  N03: {},
  N04: {},
  N05: {},
  N06: {},
};

function env(name: string): string | undefined {
  try {
    const value = import.meta.env?.[name];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  } catch {
    return undefined;
  }
}

/** Returns the configured remote endpoint without inventing a URL. */
export function peerEndpoint(peer: Exclude<SoulNucleus, 'N01'>, direction: 'in' | 'out'): string | undefined {
  const key = `VITE_SOUL_MESH_${peer}_${direction.toUpperCase()}`;
  return env(key) ?? SOUL_MESH_PEER_ENDPOINTS[peer][direction];
}

export function configuredPeers(): Record<Exclude<SoulNucleus, 'N01'>, SoulMeshEndpoint> {
  return {
    N02: { in: peerEndpoint('N02', 'in'), out: peerEndpoint('N02', 'out') },
    N03: { in: peerEndpoint('N03', 'in'), out: peerEndpoint('N03', 'out') },
    N04: { in: peerEndpoint('N04', 'in'), out: peerEndpoint('N04', 'out') },
    N05: { in: peerEndpoint('N05', 'in'), out: peerEndpoint('N05', 'out') },
    N06: { in: peerEndpoint('N06', 'in'), out: peerEndpoint('N06', 'out') },
  };
}
