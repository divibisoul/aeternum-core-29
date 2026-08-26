import type { SoulMeshCapability } from './SoulMeshCapabilities';
import type { SoulNucleus } from './SoulMeshProtocol';

export type SoulMeshHandshake = {
  protocol: 'soul-mesh/1';
  nucleus: SoulNucleus;
  version: string;
  capabilities: SoulMeshCapability[];
  transports: string[];
  timestamp: number;
};

export function createSoulMeshHandshake(
  nucleus: SoulNucleus,
  capabilities: readonly SoulMeshCapability[],
  transports: readonly string[] = [],
  version = '1.0',
): SoulMeshHandshake {
  return {
    protocol: 'soul-mesh/1',
    nucleus,
    version,
    capabilities: [...capabilities].filter(capability => capability.owner === nucleus),
    transports: [...new Set(transports.filter(Boolean))],
    timestamp: Date.now(),
  };
}

export function isSoulMeshHandshake(value: unknown): value is SoulMeshHandshake {
  if (!value || typeof value !== 'object') return false;
  const h = value as Record<string, unknown>;
  return h.protocol === 'soul-mesh/1'
    && typeof h.nucleus === 'string'
    && typeof h.version === 'string'
    && Array.isArray(h.capabilities)
    && Array.isArray(h.transports)
    && typeof h.timestamp === 'number'
    && Number.isFinite(h.timestamp);
}
