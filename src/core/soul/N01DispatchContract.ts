import { authorizeCapability } from './CapabilityAuthorization';
import { getN01Capabilities } from './CapabilityGraph';
import { verifyEnvelope, type SoulMeshEnvelope } from './SoulMeshEnvelope';

export async function validateN01Task(message: SoulMeshEnvelope, secret: string): Promise<{ ok: true; capabilityId: string } | { ok: false; reason: string }> {
  if (!(await verifyEnvelope(message, secret))) return { ok: false, reason: 'INVALID_ENVELOPE' };
  if (message.type !== 'TASK') return { ok: false, reason: 'NOT_TASK' };
  const payload = message.payload as { capabilityId?: unknown; requiredPermission?: unknown };
  if (typeof payload?.capabilityId !== 'string') return { ok: false, reason: 'MISSING_CAPABILITY' };
  if (payload.requiredPermission !== undefined && typeof payload.requiredPermission !== 'string') return { ok: false, reason: 'INVALID_PERMISSION' };
  if (!authorizeCapability({ capabilityId: payload.capabilityId, source: message.source, target: message.target, requiredPermission: payload.requiredPermission }, getN01Capabilities())) {
    return { ok: false, reason: 'CAPABILITY_NOT_AUTHORIZED' };
  }
  return { ok: true, capabilityId: payload.capabilityId };
}
