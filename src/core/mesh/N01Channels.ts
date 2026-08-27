import type { SoulNucleusId } from './types/SoulNucleusId';

export const N01_PEERS = ['N02', 'N03', 'N04', 'N05', 'N06'] as const;
export type N01PeerId = typeof N01_PEERS[number];

export type N01InboundChannelId = `N01_IN_${N01PeerId}`;
export type N01OutboundChannelId = `N01_OUT_${N01PeerId}`;

export interface N01MeshChannel<TMessage = unknown> {
  readonly id: string;
  readonly peerId: N01PeerId;
  readonly direction: 'in' | 'out';
  readonly route: string;
  readonly protocol: 'soul-mesh/1';
  send?(message: TMessage): Promise<unknown>;
  receive?(message: TMessage): Promise<unknown>;
}

export interface N01ChannelTransport<TMessage = unknown> {
  post(path: string, message: TMessage, options?: { token?: string; timeoutMs?: number }): Promise<unknown>;
}

export function createN01InboundChannel(peerId: N01PeerId): N01MeshChannel {
  return {
    id: `N01_IN_${peerId}`,
    peerId,
    direction: 'in',
    route: `/mesh/in/${peerId}`,
    protocol: 'soul-mesh/1',
  };
}

export function createN01OutboundChannel(peerId: N01PeerId): N01MeshChannel {
  return {
    id: `N01_OUT_${peerId}`,
    peerId,
    direction: 'out',
    route: `/mesh/in/N01`,
    protocol: 'soul-mesh/1',
  };
}

export const N01_IN_CHANNELS = Object.fromEntries(
  N01_PEERS.map((peer) => [peer, createN01InboundChannel(peer)])
) as Record<N01PeerId, N01MeshChannel>;

export const N01_OUT_CHANNELS = Object.fromEntries(
  N01_PEERS.map((peer) => [peer, createN01OutboundChannel(peer)])
) as Record<N01PeerId, N01MeshChannel>;

export function isN01PeerId(value: string): value is N01PeerId {
  return (N01_PEERS as readonly string[]).includes(value);
}

export function getN01ChannelPair(peerId: N01PeerId) {
  return { inbound: N01_IN_CHANNELS[peerId], outbound: N01_OUT_CHANNELS[peerId] };
}
