/**
 * Hybrid channel contract for the Soul GPU fabric.
 * A logical IN/OUT port can use different physical transports without changing
 * message identity or semantics. Transport negotiation is deliberately kept
 * separate from nucleus capability ownership.
 */
import type { SoulMeshMessage, SoulNucleus } from '../mesh/SoulMeshProtocol';

export type SoulHybridTransportKind =
  | 'WEBVIEW_BRIDGE'
  | 'LOOPBACK_HTTP'
  | 'HTTP'
  | 'REALTIME'
  | 'IN_PROCESS';

export type SoulMeshDirection = 'in' | 'out';
export type SoulMeshSlot = 1 | 2 | 3 | 4 | 5;

export interface SoulHybridChannel {
  id: `${SoulNucleus}->${SoulNucleus}:${SoulMeshDirection}:${SoulMeshSlot}`;
  source: SoulNucleus;
  target: SoulNucleus;
  direction: SoulMeshDirection;
  slot: SoulMeshSlot;
  transports: readonly SoulHybridTransportKind[];
}

export interface SoulHybridChannelAdapter {
  readonly kind: SoulHybridTransportKind;
  isAvailable(channel: SoulHybridChannel): boolean | Promise<boolean>;
  send(message: SoulMeshMessage): Promise<void>;
}

export const SOUL_HYBRID_TRANSPORT_PRIORITY: readonly SoulHybridTransportKind[] = [
  'IN_PROCESS',
  'WEBVIEW_BRIDGE',
  'LOOPBACK_HTTP',
  'REALTIME',
  'HTTP',
];

export function channelId(source: SoulNucleus, target: SoulNucleus, direction: SoulMeshDirection, slot: SoulMeshSlot): SoulHybridChannel['id'] {
  return `${source}->${target}:${direction}:${slot}`;
}

export function createHybridChannel(source: SoulNucleus, target: SoulNucleus, slot: SoulMeshSlot, direction: SoulMeshDirection): SoulHybridChannel {
  if (source === target) throw new Error('SELF_CHANNEL_NOT_ALLOWED');
  return {
    id: channelId(source, target, direction, slot),
    source,
    target,
    direction,
    slot,
    transports: SOUL_HYBRID_TRANSPORT_PRIORITY,
  };
}
