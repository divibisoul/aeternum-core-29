import { IndexedDBDiscoveryAdapter } from './SoulMeshDiscoveryAdapter';
import { SoulMeshDiscoveryRegistry } from './SoulMeshDiscovery';
import { SoulMeshPeerRegistry } from './SoulMeshPeerRegistry';
import { SoulMeshCapabilityRegistry } from './SoulMeshCapabilityRegistry';

/** N01's default discovery runtime: hot cache + durable browser persistence. */
export const soulMeshDiscovery = new SoulMeshDiscoveryRegistry(
  typeof indexedDB === 'undefined' ? undefined : new IndexedDBDiscoveryAdapter(),
);

export const soulMeshCapabilityRegistry = new SoulMeshCapabilityRegistry();
export const soulMeshPeerRegistry = new SoulMeshPeerRegistry(soulMeshDiscovery, soulMeshCapabilityRegistry);

export async function hydrateSoulMeshDiscovery(): Promise<void> {
  await soulMeshDiscovery.hydrate();
}
