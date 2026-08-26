import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';
import { createSoulMeshMessage } from './SoulMeshProtocol';
import { SoulMeshRouter } from './SoulMeshRouter';

export type N01N02LinkOptions = {
  transport: SoulMeshTransport;
  timeoutMs?: number;
};

/** Explicit N01↔N02 bidirectional link. N01 transports/routes; N02 owns its capabilities. */
export class N01N02HybridLink {
  readonly router: SoulMeshRouter;
  constructor(options: N01N02LinkOptions) {
    this.router = new SoulMeshRouter(options.transport, 'N01', options.timeoutMs ?? 30000);
  }

  requestN02<T = unknown>(capability: string, payload: T): Promise<SoulMeshMessage> {
    return this.router.request('N02', capability, payload);
  }

  eventToN02<T = unknown>(capability: string, payload: T): Promise<void> {
    return this.router.sendEvent('N02', capability, payload);
  }

  healthProbe(): Promise<SoulMeshMessage> {
    return this.requestN02('mesh.health', { requestedBy: 'N01', probe: true });
  }

  describeN02(): Promise<SoulMeshMessage> {
    return this.requestN02('mesh.describe', { requestedBy: 'N01' });
  }

  static messageForN02<T>(capability: string, payload: T): SoulMeshMessage<T> {
    return createSoulMeshMessage({ source: 'N01', target: 'N02', kind: 'request', correlationId: crypto.randomUUID(), capability, payload });
  }

  close(): void { this.router.close(); }
}
