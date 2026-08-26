import type { SoulNucleus } from './SoulMeshProtocol';

export type SoulMeshCapability = {
  id: string;
  version: string;
  description: string;
  request: boolean;
  response: boolean;
  events: boolean;
  /** True when this capability is backed by an observed local handler. */
  implemented?: boolean;
};

/**
 * N01's canonical mesh capabilities. This is an inventory of real interfaces,
 * not a claim that remote nuclei already implement them.
 */
export const SOUL_MESH_CORE_CAPABILITIES: Record<SoulNucleus, SoulMeshCapability[]> = {
  N01: [
    { id: 'mesh.handshake', version: '2.0', description: 'Protocol and nucleus negotiation', request: true, response: true, events: false, implemented: true },
    { id: 'mesh.health', version: '2.0', description: 'Live health and transport state', request: true, response: true, events: true, implemented: true },
    { id: 'mesh.capabilities', version: '2.0', description: 'Observed local capability inventory', request: true, response: true, events: true, implemented: true },
    { id: 'ai.reasoning', version: '2.0', description: 'N01 cognitive pipeline entry point', request: true, response: true, events: true, implemented: true },
    { id: 'cognitive.intent', version: '2.0', description: 'Intent analysis through N01 IntentAnalyzer', request: true, response: true, events: false, implemented: true },
    { id: 'agi.process', version: '2.0', description: 'N01 AeternumAGI processing and metrics', request: true, response: true, events: true, implemented: true },
    { id: 'android.state', version: '2.0', description: 'Android/native state supplied by the host bridge when available', request: true, response: true, events: true, implemented: false },
  ],
  N02: [],
  N03: [],
  N04: [],
  N05: [],
  N06: [],
};
