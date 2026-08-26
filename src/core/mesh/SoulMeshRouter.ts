import type { SoulMeshMessage, SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';
import { EventBus } from '../EventBus';

export type SoulMeshRequestHandler = (message: SoulMeshMessage) => unknown | Promise<unknown>;

/** Transport-agnostic bidirectional router for the six AI nuclei. */
export class SoulMeshRouter {
  private readonly pending = new Map<string, { resolve: (message: SoulMeshMessage) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private readonly handlers = new Map<string, SoulMeshRequestHandler>();
  private readonly seen = new Map<string, number>();
  private readonly unsubscribe: () => void;
  private readonly seenTtlMs = 120000;

  constructor(private readonly transport: SoulMeshTransport, private readonly local: SoulNucleus, private readonly timeoutMs = 30000) {
    this.unsubscribe = transport.onMessage(async (message) => this.handle(message));
  }

  async request<T = unknown>(target: SoulNucleus, capability: string, payload: T): Promise<SoulMeshMessage> {
    if (target === this.local) throw new Error('Soul Mesh target must be a remote nucleus');
    if (!capability.trim()) throw new Error('Soul Mesh capability is required');
    const correlationId = crypto.randomUUID();
    const message: SoulMeshMessage<T> = { protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId, source: this.local, target, kind: 'request', capability, payload, timestamp: Date.now() };
    return new Promise<SoulMeshMessage>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(correlationId); reject(new Error(`Soul Mesh request timeout: ${target}/${capability}`)); }, this.timeoutMs);
      this.pending.set(correlationId, { resolve, reject, timer });
      void this.transport.send(message).catch((error) => { clearTimeout(timer); this.pending.delete(correlationId); reject(error instanceof Error ? error : new Error(String(error))); });
    });
  }

  onRequest(capability: string, handler: SoulMeshRequestHandler): () => void {
    if (!capability.trim()) throw new Error('Soul Mesh capability is required');
    this.handlers.set(capability, handler);
    return () => { if (this.handlers.get(capability) === handler) this.handlers.delete(capability); };
  }

  async sendEvent(target: SoulNucleus, capability: string, payload: unknown): Promise<void> {
    if (target === this.local) throw new Error('Soul Mesh target must be remote');
    await this.transport.send({ protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: crypto.randomUUID(), source: this.local, target, kind: 'event', capability, payload, timestamp: Date.now() });
  }

  private async handle(message: SoulMeshMessage): Promise<void> {
    if (!isSoulMeshMessage(message)) {
      await EventBus.emit('audit:warning', { message: 'Rejected invalid Soul Mesh message', severity: 'medium' });
      return;
    }
    if (message.target !== this.local) return;
    const now = Date.now();
    for (const [id, timestamp] of this.seen) if (now - timestamp > this.seenTtlMs) this.seen.delete(id);
    if (this.seen.has(message.id)) return;
    this.seen.set(message.id, now);

    if (message.kind === 'response' || message.kind === 'error') {
      const pending = this.pending.get(message.correlationId);
      if (!pending) return;
      clearTimeout(pending.timer); this.pending.delete(message.correlationId);
      if (message.kind === 'error') pending.reject(new Error(String((message.payload as { error?: unknown })?.error ?? 'Soul Mesh error')));
      else pending.resolve(message);
      return;
    }

    if (message.kind === 'request') {
      const handler = message.capability ? this.handlers.get(message.capability) : undefined;
      if (!handler) {
        await this.transport.send({ protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: message.correlationId, source: this.local, target: message.source, kind: 'error', capability: message.capability, payload: { code: 'CAPABILITY_HANDLER_NOT_REGISTERED', error: `Capability not registered: ${message.capability ?? 'unknown'}` }, timestamp: Date.now() });
        return;
      }
      try {
        const result = await handler(message);
        await this.transport.send({ protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: message.correlationId, source: this.local, target: message.source, kind: 'response', capability: message.capability, payload: result, timestamp: Date.now() });
      } catch (error) {
        await this.transport.send({ protocol: 'soul-mesh/1', id: crypto.randomUUID(), correlationId: message.correlationId, source: this.local, target: message.source, kind: 'error', capability: message.capability, payload: { code: 'CAPABILITY_HANDLER_FAILED', error: error instanceof Error ? error.message : String(error) }, timestamp: Date.now() });
      }
      return;
    }
    await EventBus.emit('soul:mesh:message', message);
  }

  close(): void {
    this.unsubscribe();
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error('Soul Mesh router closed')); }
    this.pending.clear(); this.handlers.clear(); this.seen.clear();
  }
}
