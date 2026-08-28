import type { CapabilityDescriptor } from './CapabilityGraph';

export interface CapabilityRequest {
  capabilityId: string;
  source: string;
  target: string;
}

export function authorizeCapability(request: CapabilityRequest, capabilities: readonly CapabilityDescriptor[]): boolean {
  const capability = capabilities.find(c => c.id === request.capabilityId);
  if (!capability || capability.status !== 'AVAILABLE') return false;
  if (capability.owner !== request.target) return false;
  return capability.permissions.length === 0 || capability.permissions.includes(request.source);
}
