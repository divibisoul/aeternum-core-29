import type { SoulNucleus } from './SoulMeshProtocol';
import { SOUL_MESH_CONTRACT_VERSION } from './SoulMeshProtocol';

export type SoulMeshRegistration = {
  nucleus: Exclude<SoulNucleus, 'N01'>;
  url: string;
  capabilities: string[];
  transports?: string[];
  channels?: Record<string, unknown>;
  /** Canonical Mesh contract version advertised by the peer. */
  contractVersion?: string;
  /** @deprecated Legacy alias retained for backward compatibility. */
  version?: string;
  lastSeen: number;
};

/** In-memory registry used by N01 as the primary discovery abstraction. */
export class SoulMeshDiscoveryRegistry {
  private readonly peers = new Map<Exclude<SoulNucleus, 'N01'>, SoulMeshRegistration>();

  register(registration: SoulMeshRegistration): SoulMeshRegistration {
    if (!/^https?:\/\//i.test(registration.url)) throw new Error('INVALID_PEER_URL');
    const contractVersion = registration.contractVersion ?? registration.version;
    if (contractVersion && contractVersion !== SOUL_MESH_CONTRACT_VERSION) {
      throw new Error(`UNSUPPORTED_MESH_CONTRACT_VERSION:${contractVersion}`);
    }
    this.peers.set(registration.nucleus, {
      ...registration,
      ...(contractVersion ? { contractVersion, version: registration.version ?? contractVersion } : {}),
      transports: registration.transports ? [...new Set(registration.transports)].sort() : undefined,
      lastSeen: Date.now(),
    });
    return this.peers.get(registration.nucleus)!;
  }

  resolve(nucleus: Exclude<SoulNucleus, 'N01'>): SoulMeshRegistration | undefined { return this.peers.get(nucleus); }

  updateCapabilities(nucleus: Exclude<SoulNucleus, 'N01'>, capabilities: string[], contractVersion?: string, metadata?: Pick<SoulMeshRegistration, 'transports' | 'channels'>): SoulMeshRegistration | undefined {
    const peer = this.peers.get(nucleus);
    if (!peer) return undefined;
    if (contractVersion && contractVersion !== SOUL_MESH_CONTRACT_VERSION) {
      throw new Error(`UNSUPPORTED_MESH_CONTRACT_VERSION:${contractVersion}`);
    }
    peer.capabilities = [...new Set(capabilities)].sort();
    if (contractVersion) {
      peer.contractVersion = contractVersion;
      peer.version = peer.version ?? contractVersion;
    }
    if (metadata?.transports) peer.transports = [...new Set(metadata.transports)].sort();
    if (metadata?.channels) peer.channels = { ...metadata.channels };
    peer.lastSeen = Date.now();
    return peer;
  }

  heartbeat(nucleus: Exclude<SoulNucleus, 'N01'>): boolean {
    const peer = this.peers.get(nucleus);
    if (!peer) return false;
    peer.lastSeen = Date.now();
    return true;
  }

  list(): SoulMeshRegistration[] { return [...this.peers.values()]; }
}
