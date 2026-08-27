import { IndexedDBDiscoveryAdapter } from './SoulMeshDiscoveryAdapter';
import { SoulMeshDiscoveryRegistry } from './SoulMeshDiscovery';
import { SoulMeshPeerRegistry } from './SoulMeshPeerRegistry';

/** N01's default discovery runtime: hot cache + durable browser persistence. */
export const soulMeshDiscovery = new SoulMeshDiscoveryRegistry(
  typeof indexedDB === 'undefined' ? undefined : new IndexedDBDiscoveryAdapter(),
);

export const soulMeshPeerRegistry = new SoulMeshPeerRegistry(soulMeshDiscovery);

export async function hydrateSoulMeshDiscovery(): Promise<void> {
  await soulMeshDiscovery.hydrate();
}
