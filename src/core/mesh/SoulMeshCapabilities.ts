import type { SoulNucleus } from './SoulMeshProtocol';

export type SoulMeshCapability = {
  id: string;
  version: string;
  description: string;
  request: boolean;
  response: boolean;
  events: boolean;
};

export const SOUL_MESH_CORE_CAPABILITIES: Record<SoulNucleus, SoulMeshCapability[]> = {
  aeternum: [{ id: 'orchestration', version: '1.0', description: 'Soul orchestration and routing', request: true, response: true, events: true }],
  nexus: [{ id: 'cognitive-ui', version: '1.0', description: 'Cognitive interaction and UI services', request: true, response: true, events: true }],
  eternium: [{ id: 'cognitive-processing', version: '1.0', description: 'Cognitive processing services', request: true, response: true, events: true }],
  chatbot: [{ id: 'conversation', version: '1.0', description: 'Conversational services', request: true, response: true, events: true }],
  chatbots: [{ id: 'conversation', version: '1.0', description: 'Conversational services', request: true, response: true, events: true }],
  'chatbot-2000': [{ id: 'conversation', version: '1.0', description: 'Conversational services', request: true, response: true, events: true }],
};
