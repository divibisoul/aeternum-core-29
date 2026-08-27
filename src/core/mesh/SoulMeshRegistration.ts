import type { SoulNucleus } from './SoulMeshProtocol';
import { SoulMeshDiscoveryRegistry, type SoulMeshRegistration } from './SoulMeshDiscovery';

export const soulMeshDiscovery = new SoulMeshDiscoveryRegistry();

export function registerPeer(input: SoulMeshRegistration) {
  return soulMeshDiscovery.register(input);
}

export function resolvePeer(nucleus: Exclude<SoulNucleus, 'N01'>) {
  return soulMeshDiscovery.resolve(nucleus);
}
