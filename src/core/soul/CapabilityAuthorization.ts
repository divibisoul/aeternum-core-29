import type { SoulCapability } from './CapabilityGraph';

export interface CapabilityRequest {
  capabilityId: string;
  source: string;
  target: string;
  requiredPermission?: string;
}

export function authorizeCapability(request: CapabilityRequest, capabilities: readonly SoulCapability[]): boolean {
  if (!request.source || !request.target || !request.capabilityId) return false;
  const capability = capabilities.find(c => c.id === request.capabilityId);
  if (!capability || capability.status !== 'AVAILABLE') return false;
  if (capability.node !== request.target) return false;
  if (!capability.permission) return false;
  if (request.requiredPermission && capability.permission !== request.requiredPermission) return false;
  return true;
}
