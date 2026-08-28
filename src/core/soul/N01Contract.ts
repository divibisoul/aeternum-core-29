export const N01_NODE_ID = 'N01' as const;
export const SOUL_MESH_VERSION = '1.0' as const;
export const SOUL_MESH_MESSAGE_TYPES = ['PING','HEALTH','CAPABILITY_REQUEST','TASK','TASK_RESULT','ERROR'] as const;

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

export function validateCapabilityContract(value: unknown): value is CapabilityContract {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.version === 'string' && typeof v.implementation === 'string' &&
    (v.status === 'AVAILABLE' || v.status === 'DEGRADED' || v.status === 'UNAVAILABLE') &&
    Array.isArray(v.input) && Array.isArray(v.output) && typeof v.latency_ms === 'number' &&
    typeof v.privacy === 'number' && typeof v.cost === 'number';
}
