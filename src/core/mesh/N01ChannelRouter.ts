import {
  N01_IN_CHANNELS,
  N01_OUT_CHANNELS,
  isN01PeerId,
  type N01PeerId,
  type N01ChannelTransport,
} from './N01Channels';

export interface MeshEnvelope {
  version: 'soul-mesh/1';
  id: string;
  kind: 'request' | 'response' | 'event';
  source: string;
  target: string;
  correlationId?: string;
  payload?: unknown;
}

export interface N01InboundHandler {
  handle(message: MeshEnvelope): Promise<MeshEnvelope | void>;
}

export interface N01Discovery {
  resolve(peerId: N01PeerId): Promise<{ endpoint: string } | null>;
}

/**
 * Technology-neutral N01 channel fabric.
 * HTTP/WebSocket/native Android transports are adapters behind this interface.
 */
export class N01ChannelRouter {
  constructor(
    private readonly transport: N01ChannelTransport<MeshEnvelope>,
    private readonly discovery: N01Discovery,
    private readonly inbound: N01InboundHandler,
  ) {}

  async receive(peerId: string, message: MeshEnvelope): Promise<MeshEnvelope | void> {
    if (!isN01PeerId(peerId) || message.version !== 'soul-mesh/1') {
      throw new Error('Invalid N01 inbound channel or Mesh protocol version');
    }
    if (message.source !== peerId || message.target !== 'N01') {
      throw new Error(`N01 inbound identity mismatch: ${message.source} -> ${message.target}`);
    }
    return this.inbound.handle(message);
  }

  async send(peerId: N01PeerId, message: MeshEnvelope, token?: string): Promise<unknown> {
    if (message.version !== 'soul-mesh/1' || message.source !== 'N01' || message.target !== peerId) {
      throw new Error(`N01 outbound identity mismatch for ${peerId}`);
    }
    const resolved = await this.discovery.resolve(peerId);
    if (!resolved?.endpoint) throw new Error(`Peer ${peerId} not registered`);
    const channel = N01_OUT_CHANNELS[peerId];
    const path = `${resolved.endpoint.replace(/\/$/, '')}${channel.route}`;
    return this.transport.post(path, message, { token });
  }

  channelInventory() {
    return {
      inbound: Object.values(N01_IN_CHANNELS).map(({ id, peerId, route }) => ({ id, peerId, route })),
      outbound: Object.values(N01_OUT_CHANNELS).map(({ id, peerId, route }) => ({ id, peerId, route })),
    };
  }
}
