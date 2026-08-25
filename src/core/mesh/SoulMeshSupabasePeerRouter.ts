import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';
import { SoulMeshRouter } from './SoulMeshRouter';
import { SoulMeshSupabaseTransport } from './SoulMeshSupabaseTransport';
import { SoulMeshPeerTransport } from './SoulMeshPeerTransport';

export function createSupabaseSoulMeshRouter(local: SoulNucleus): SoulMeshRouter {
  const transport = new SoulMeshSupabaseTransport();
  return new SoulMeshRouter(new SoulMeshPeerTransport(transport, local), local);
}

export function isRoutedTo(message: SoulMeshMessage, local: SoulNucleus): boolean {
  return message.protocol === 'soul-mesh/1' && message.target === local && message.source !== local;
}
