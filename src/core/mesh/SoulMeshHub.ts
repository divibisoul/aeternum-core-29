import type { SoulMeshMessage, SoulMeshTransport, SoulNucleus } from './SoulMeshProtocol';
import { soulMeshCapabilityRegistry } from './SoulMeshCapabilities';

export type SoulMeshHubResult = {
  accepted: boolean;
  reason?: 'TARGET_NOT_REGISTERED' | 'CAPABILITY_NOT_ADVERTISED';
};

/** Core mesh hub. Routes messages between nuclei without owning their implementations. */
export class SoulMeshHub {
  private readonly handlers = new Map<SoulNucleus, (message: SoulMeshMessage) => void | Promise<void>>();
  constructor(private readonly transport: SoulMeshTransport) {}

  register(nucleus: SoulNucleus, handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    this.handlers.set(nucleus, handler);
    return () => this.handlers.delete(nucleus);
  }

  /** Capability-aware preflight. Generic events and messages remain unrestricted. */
  async send(message: SoulMeshMessage): Promise<SoulMeshHubResult> {
    if (message.kind === 'request' && message.capability) {
      const known = soulMeshCapabilityRegistry.get(message.target, message.capability);
      const advertised = soulMeshCapabilityRegistry.list(message.target);
      if (advertised.length > 0 && !known) {
        return { accepted: false, reason: 'CAPABILITY_NOT_ADVERTISED' };
      }
      if (known && !known.request) {
        return { accepted: false, reason: 'CAPABILITY_NOT_ADVERTISED' };
      }
    }

    await this.transport.send(message);
    return { accepted: true };
  }

  async receive(message: SoulMeshMessage): Promise<void> {
    const handler = this.handlers.get(message.target);
    if (handler) await handler(message);
  }
}
