import type { SoulNucleus } from './SoulMeshProtocol';

export type SoulMeshCapability = {
  id: string;
  version: string;
  description: string;
  request: boolean;
  response: boolean;
  events: boolean;
  owner: SoulNucleus;
  execution: 'cognitive' | 'tool' | 'native' | 'orchestration' | 'observability';
};

export const SOUL_MESH_CORE_CAPABILITIES: Record<SoulNucleus, SoulMeshCapability[]> = {
  N01: [
    { id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N01', execution: 'observability' },
    { id: 'mesh.health', version: '1.1', description: 'Runtime and transport health', request: true, response: true, events: true, owner: 'N01', execution: 'observability' },
    { id: 'mesh.capabilities', version: '1.1', description: 'Advertise executable N01 capabilities', request: true, response: true, events: true, owner: 'N01', execution: 'observability' },
    { id: 'cognitive.intent', version: '1.0', description: 'Intent analysis through N01 cognitive pipeline', request: true, response: true, events: false, owner: 'N01', execution: 'cognitive' },
    { id: 'agi.process', version: '1.0', description: 'AeternumAGI processing adapter', request: true, response: true, events: true, owner: 'N01', execution: 'cognitive' },
    { id: 'ai.reasoning', version: '1.0', description: 'Provider-neutral reasoning adapter', request: true, response: true, events: true, owner: 'N01', execution: 'cognitive' },
    { id: 'android.device_info', version: '1.0', description: 'Observed Android device information', request: true, response: true, events: false, owner: 'N01', execution: 'native' },
    { id: 'android.battery', version: '1.0', description: 'Observed Android battery state', request: true, response: true, events: true, owner: 'N01', execution: 'native' },
    { id: 'android.memory', version: '1.0', description: 'Observed Android memory state', request: true, response: true, events: true, owner: 'N01', execution: 'native' },
    { id: 'android.network', version: '1.0', description: 'Observed Android network state', request: true, response: true, events: true, owner: 'N01', execution: 'native' },
  ],
  N02: [{ id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N02', execution: 'observability' }],
  N03: [{ id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N03', execution: 'observability' }],
  N04: [{ id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N04', execution: 'observability' }],
  N05: [{ id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N05', execution: 'observability' }],
  N06: [{ id: 'mesh.handshake', version: '1.1', description: 'Mesh negotiation and capability discovery', request: true, response: true, events: false, owner: 'N06', execution: 'observability' }],
};
