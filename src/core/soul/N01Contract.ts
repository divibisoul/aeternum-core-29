export { SOUL_MESH_VERSION, SOUL_MESH_CONTRACT_VERSION, MESSAGE_TYPES as SOUL_MESH_MESSAGE_TYPES } from '../../../lib/soul-mesh/SoulMeshEnvelope.ts';
export const N01_NODE_ID = 'N01' as const;

export interface CapabilityContract {
  id: string;
  version: string;
  implementation: string;
  status: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';
  input: string[];
  output: string[];
  latency_ms: number;
  privacy: number;
  cost: number;
}

/** Validate the Mesh-facing capability projection without creating a second capability registry. */
export function validateCapabilityContract(value: unknown): value is CapabilityContract {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  if (typeof v.id !== 'string' || !v.id.trim() || typeof v.version !== 'string' || !v.version.trim() || typeof v.implementation !== 'string' || !v.implementation.trim()) return false;
  if (v.status !== 'AVAILABLE' && v.status !== 'DEGRADED' && v.status !== 'UNAVAILABLE') return false;
  if (!Array.isArray(v.input) || !v.input.every((item) => typeof item === 'string' && item.trim())) return false;
  if (!Array.isArray(v.output) || !v.output.every((item) => typeof item === 'string' && item.trim())) return false;
  if (typeof v.latency_ms !== 'number' || !Number.isFinite(v.latency_ms) || v.latency_ms < 0) return false;
  if (typeof v.privacy !== 'number' || !Number.isFinite(v.privacy) || v.privacy < 0 || v.privacy > 1) return false;
  if (typeof v.cost !== 'number' || !Number.isFinite(v.cost) || v.cost < 0 || v.cost > 1) return false;
  return true;
}
