import { getN01Capabilities, type SoulCapability } from './CapabilityGraph';
import { validateCapabilityContract, type CapabilityContract } from './N01Contract';

/**
 * Adapts the N01 internal capability graph to the existing Soul Mesh contract.
 * This avoids introducing a second wire protocol while keeping local metadata richer.
 */
export function toN01MeshCapability(capability: SoulCapability): CapabilityContract {
  const contract: CapabilityContract = {
    id: capability.id,
    version: capability.version,
    implementation: `n01:${capability.kind}:${capability.id}`,
    status: capability.status,
    input: [...capability.input],
    output: [...capability.output],
    latency_ms: capability.cost === 0 ? 0 : Math.max(1, Math.round(capability.cost * 1000)),
    privacy: capability.privacy,
    cost: capability.cost,
  };

  if (!validateCapabilityContract(contract)) {
    throw new Error(`INVALID_N01_MESH_CAPABILITY:${capability.id}`);
  }

  return contract;
}

export function getN01MeshCapabilities(): CapabilityContract[] {
  return getN01Capabilities().map(toN01MeshCapability);
}

export function validateN01MeshCapabilities(): void {
  for (const capability of getN01MeshCapabilities()) {
    if (capability.status === 'UNAVAILABLE') continue;
    if (capability.latency_ms < 0) throw new Error(`INVALID_N01_CAPABILITY_LATENCY:${capability.id}`);
    if (capability.privacy < 0 || capability.privacy > 1) throw new Error(`INVALID_N01_CAPABILITY_PRIVACY:${capability.id}`);
    if (capability.cost < 0 || capability.cost > 1) throw new Error(`INVALID_N01_CAPABILITY_COST:${capability.id}`);
  }
}
