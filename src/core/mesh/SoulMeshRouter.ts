import type { SoulMeshMessage, SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
import { EventBus } from '../EventBus';

/** Bidirectional nucleus router. It correlates requests/responses and forwards unsolicited events. */
export class SoulMeshRouter {
  private readonly pending = new Map<string, { resolve: (message: SoulMeshMessage) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private readonly unsubscribe: () => void;

  constructor(private readonly transport: SoulMeshTransport, private readonly local: SoulNucleus, private readonly timeoutMs = 30000) {
    this.unsubscribe = transport.onMessage(async (message) => this.handle(message));
  }

  async request<T = unknown>(target: SoulNucleus, capability: string, payload: T): Promise<SoulMeshMessage> {
    const correlationId = crypto.randomUUID();
    const message: SoulMeshMessage<T> = {
      protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId,
      source: this.local, target, kind: 'request', capability, payload, timestamp: Date.now(),
    };
    return new Promise<SoulMeshMessage>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(correlationId); reject(new Error(`Soul Mesh request timeout: ${target}/${capability}`)); }, this.timeoutMs);
      this.pending.set(correlationId, { resolve, reject, timer });
      void this.transport.send(message).catch((error) => { clearTimeout(timer); this.pending.delete(correlationId); reject(error instanceof Error ? error : new Error(String(error))); });
    });
  }

  async sendEvent(target: SoulNucleus, capability: string, payload: unknown): Promise<void> {
    await this.transport.send({ protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: crypto.randomUUID(), source: this.local, target, kind: 'event', capability, payload, timestamp: Date.now() });
  }

  private async handle(message: SoulMeshMessage): Promise<void> {
    if (message.target !== this.local) return;
    if (message.kind === 'response' || message.kind === 'error') {
      const pending = this.pending.get(message.correlationId);
      if (!pending) return;
      clearTimeout(pending.timer); this.pending.delete(message.correlationId);
      if (message.kind === 'error') pending.reject(new Error(String((message.payload as { error?: unknown })?.error ?? 'Soul Mesh error')));
      else pending.resolve(message);
      return;
    }
    await EventBus.emit('soul:mesh:message' as never, message as never).catch(() => undefined);
  }

  close(): void { this.unsubscribe(); for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error('Soul Mesh router closed')); } this.pending.clear(); }
}
