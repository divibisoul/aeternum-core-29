import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';
import { SoulMeshHttpTransport } from './SoulMeshHttpTransport';
import { SoulMeshRouter } from './SoulMeshRouter';
import { N01_IN_CHANNELS, N01_OUT_CHANNELS, N01_PEERS, type N01PeerId } from './N01Channels';
import { SoulMeshDiscoveryRegistry } from './SoulMeshDiscovery';

export interface N01InboundChannelHandler { receive(peerId: N01PeerId, message: unknown): Promise<void>; }
export interface N01OutboundChannelFactory { create(peerId: N01PeerId, endpoint: string, token?: string): SoulMeshTransport; }

export class DefaultN01OutboundChannelFactory implements N01OutboundChannelFactory {
  create(_peerId: N01PeerId, endpoint: string, token?: string): SoulMeshTransport {
    return new SoulMeshHttpTransport(`${endpoint.replace(/\/$/, '')}/mesh/in/N01`, {
      authToken: token,
      timeoutMs: 3000,
      retries: 3,
      retryDelayMs: 100,
    });
  }
}

/** Five independent channels sharing one canonical SoulMeshRouter. */
export class N01MeshChannelFabric implements N01InboundChannelHandler {
  private readonly outbound = new Map<N01PeerId, SoulMeshTransport>();

  constructor(
    private readonly router: SoulMeshRouter,
    private readonly discovery: SoulMeshDiscoveryRegistry,
    private readonly factory: N01OutboundChannelFactory = new DefaultN01OutboundChannelFactory(),
  ) {}

  async receive(peerId: N01PeerId, message: unknown): Promise<void> {
    if (!isSoulMeshMessage(message)) throw new Error('Invalid soul-mesh/1 message');
    if (message.source !== peerId || message.target !== 'N01') throw new Error(`N01_IN_${peerId} identity mismatch`);
    await this.router.ingest(message);
  }

  async send(peerId: N01PeerId, message: SoulMeshMessage): Promise<void> {
    if (message.source !== 'N01' || message.target !== peerId) throw new Error(`N01_OUT_${peerId} identity mismatch`);
    let transport = this.outbound.get(peerId);
    if (!transport) {
      const registration = this.discovery.resolve(peerId);
      if (!registration) throw new Error(`PEER_NOT_REGISTERED:${peerId}`);
      transport = this.factory.create(peerId, registration.url, registration.authToken);
      this.outbound.set(peerId, transport);
    }
    await transport.send(message);
  }

  inventory() {
    return {
      inbound: N01_PEERS.map((peer) => ({ id: N01_IN_CHANNELS[peer].id, route: N01_IN_CHANNELS[peer].route, peer })),
      outbound: N01_PEERS.map((peer) => ({ id: N01_OUT_CHANNELS[peer].id, route: N01_OUT_CHANNELS[peer].route, peer })),
    };
  }

  async close(): Promise<void> {
    const transports = [...this.outbound.values()];
    this.outbound.clear();
    await Promise.all(transports.map((transport) => transport.close?.()));
  }
}
