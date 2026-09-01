import { N01_TRANSPORT_REGISTRY, type TransportKind, rankCompatible } from './HybridTransportRegistry.ts';

export type CapabilityAvailability = 'executable' | 'declared' | 'unavailable';

export interface MeshPeerCapability {
  nucleus: string;
  capability: string;
  availability: CapabilityAvailability;
  transports: readonly TransportKind[];
}

export interface MeshCapabilityLink {
  source: string;
  target: string;
  capability: string;
  transport: TransportKind;
  executable: boolean;
}

/**
 * Builds executable cross-nucleus links from discovery data.
 * It does not create a transport or bypass the existing Mesh.
 * Only capabilities explicitly reported as executable become runnable links.
 */
export function buildCapabilityLinks(localTransports: readonly TransportKind[], peers: readonly MeshPeerCapability[]): readonly MeshCapabilityLink[] {
  const links: MeshCapabilityLink[] = [];
  for (const peer of peers) {
    if (peer.nucleus === 'N01' || peer.availability !== 'executable') continue;
    const transport = rankCompatible(localTransports, peer.transports);
    if (!transport || !N01_TRANSPORT_REGISTRY.some(t => t.kind === transport && t.bidirectional)) continue;
    links.push({ source: 'N01', target: peer.nucleus, capability: peer.capability, transport, executable: true });
  }
  return links;
}

export function canCompose(links: readonly MeshCapabilityLink[], first: string, second: string): boolean {
  const firstLink = links.find(link => link.capability === first && link.executable);
  const secondLink = links.find(link => link.capability === second && link.executable);
  return Boolean(firstLink && secondLink);
}
