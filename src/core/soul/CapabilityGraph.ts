export type CapabilityStatus = 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';
export type CapabilityKind = 'local' | 'browser' | 'cloud';

export interface SoulCapability {
  id: string;
  version: string;
  node: 'N01';
  kind: CapabilityKind;
  status: CapabilityStatus;
  input: string[];
  output: string[];
  privacy: number;
  cost: number;
  dependencies: string[];
  permission: string;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const N01_CAPABILITIES: readonly SoulCapability[] = [
  { id: 'cognitive.orchestration', version: '1.0', node: 'N01', kind: 'local', status: 'AVAILABLE', input: ['text/plain'], output: ['application/json'], privacy: 1, cost: 0, dependencies: [], permission: 'cognitive:orchestrate' },
  { id: 'chat.generate', version: '1.0', node: 'N01', kind: 'cloud', status: 'DEGRADED', input: ['text/plain'], output: ['text/plain'], privacy: 0.4, cost: 0.8, dependencies: ['cognitive.orchestration'], permission: 'chat:send' },
  { id: 'browser.session', version: '1.0', node: 'N01', kind: 'browser', status: 'DEGRADED', input: ['application/json'], output: ['text/plain', 'application/json'], privacy: 0.8, cost: 0, dependencies: ['cognitive.orchestration'], permission: 'browser:session' },
  { id: 'mesh.transport.negotiate', version: '1.0', node: 'N01', kind: 'local', status: 'AVAILABLE', input: ['application/json'], output: ['application/json'], privacy: 1, cost: 0, dependencies: [], permission: 'mesh:negotiate' },
];

export function getN01Capabilities(): SoulCapability[] {
  return N01_CAPABILITIES.map((capability) => ({ ...capability, input: [...capability.input], output: [...capability.output], dependencies: [...capability.dependencies] }));
}

export function validateCapabilityGraph(capabilities: readonly SoulCapability[] = N01_CAPABILITIES): void {
  const ids = new Set<string>();
  for (const capability of capabilities) {
    if (!capability.id || ids.has(capability.id)) throw new Error(`Invalid or duplicated capability id: ${capability.id}`);
    ids.add(capability.id);
    if (capability.node !== 'N01') throw new Error(`Capability owned by unexpected node: ${capability.id}`);
    if (capability.version !== '1.0') throw new Error(`Unsupported capability version: ${capability.id}`);
    if (capability.privacy !== clamp01(capability.privacy) || capability.cost !== clamp01(capability.cost)) throw new Error(`Capability score must be between 0 and 1: ${capability.id}`);
    for (const dependency of capability.dependencies) {
      if (!ids.has(dependency)) throw new Error(`Unknown capability dependency: ${capability.id} -> ${dependency}`);
    }
  }
}
