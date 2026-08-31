import type { SoulMeshCapability } from './SoulMeshCapabilities';
import { SOUL_MESH_CONTRACT_VERSION, SOUL_MESH_PROTOCOL, type SoulNucleus } from './SoulMeshProtocol';

export type SoulMeshHandshake = {
  protocol: typeof SOUL_MESH_PROTOCOL;
  contractVersion: typeof SOUL_MESH_CONTRACT_VERSION;
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
  version = SOUL_MESH_CONTRACT_VERSION,
): SoulMeshHandshake {
  return {
    protocol: SOUL_MESH_PROTOCOL,
    contractVersion: SOUL_MESH_CONTRACT_VERSION,
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
  return h.protocol === SOUL_MESH_PROTOCOL
    && h.contractVersion === SOUL_MESH_CONTRACT_VERSION
    && typeof h.nucleus === 'string'
    && typeof h.version === 'string'
    && Array.isArray(h.capabilities)
    && Array.isArray(h.transports)
    && typeof h.timestamp === 'number'
    && Number.isFinite(h.timestamp);
}
