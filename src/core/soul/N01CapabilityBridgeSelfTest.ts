import { getN01MeshCapabilities, validateN01MeshCapabilities } from './N01CapabilityBridge';

export function runN01CapabilityBridgeSelfTest(): { ok: true; count: number } {
  validateN01MeshCapabilities();
  const capabilities = getN01MeshCapabilities();
  if (capabilities.length === 0) throw new Error('N01_CAPABILITY_BRIDGE_EMPTY');

  const ids = new Set<string>();
  for (const capability of capabilities) {
    if (ids.has(capability.id)) throw new Error(`N01_CAPABILITY_BRIDGE_DUPLICATE:${capability.id}`);
    ids.add(capability.id);
    if (!capability.implementation.startsWith('n01:')) throw new Error(`N01_CAPABILITY_BRIDGE_IMPLEMENTATION_MISSING:${capability.id}`);
  }
  return { ok: true, count: capabilities.length };
}
