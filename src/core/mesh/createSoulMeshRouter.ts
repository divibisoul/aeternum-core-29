import type { SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
import { SoulMeshRouter } from './SoulMeshRouter';
import { SoulMeshPeerTransport } from './SoulMeshPeerTransport';

export function createSoulMeshRouter(local: SoulNucleus, transport: SoulMeshTransport): SoulMeshRouter {
  return new SoulMeshRouter(new SoulMeshPeerTransport(transport, local), local);
}
