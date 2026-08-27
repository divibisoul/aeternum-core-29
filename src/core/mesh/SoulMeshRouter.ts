import type { SoulMeshMessage, SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
import { SOUL_MESH_CONTRACT_VERSION, SOUL_MESH_PROTOCOL } from './SoulMeshProtocol';
import { EventBus } from '../EventBus';

export type SoulMeshRequestHandler = (message: SoulMeshMessage) => unknown | Promise<unknown>;

/** Bidirectional nucleus router. Requests are executed locally and answered; events are published internally. */
export class SoulMeshRouter {
  private readonly pending = new Map<string, { resolve: (message: SoulMeshMessage) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private readonly handlers = new Map<string, SoulMeshRequestHandler>();
  private readonly unsubscribe: () => void;

  constructor(private readonly transport: SoulMeshTransport, private readonly local: SoulNucleus, private readonly timeoutMs = 30000) {
    this.unsubscribe = transport.onMessage(async (message) => this.handle(message));
  }

  async request<T = unknown>(target: SoulNucleus, capability: string, payload: T): Promise<SoulMeshMessage> {
    const correlationId = crypto.randomUUID();
    const message: SoulMeshMessage<T> = {
      protocol: SOUL_MESH_PROTOCOL, contractVersion: SOUL_MESH_CONTRACT_VERSION,
      id: crypto.randomUUID(), correlationId, source: this.local, target,
      kind: 'request', capability, payload, timestamp: Date.now(),
    };
    return this.waitForResponse(correlationId, async () => this.transport.send(message), target, capability);
  }

  onRequest(capability: string, handler: SoulMeshRequestHandler): () => void {
    this.handlers.set(capability, handler);
    return () => { if (this.handlers.get(capability) === handler) this.handlers.delete(capability); };
  }

  /** Sends an event and waits for the peer to answer with a correlated response/error. */
  async sendEventAndWait(target: SoulNucleus, capability: string, payload: unknown, timeoutMs = 3000): Promise<SoulMeshMessage> {
    const correlationId = crypto.randomUUID();
    const message: SoulMeshMessage = { protocol: SOUL_MESH_PROTOCOL, contractVersion: SOUL_MESH_CONTRACT_VERSION, id: crypto.randomUUID(), correlationId, source: this.local, target, kind: 'event', capability, payload, timestamp: Date.now() };
    return this.waitForResponse(correlationId, async () => this.transport.send(message), target, capability, timeoutMs);
  }

  async sendEvent(target: SoulNucleus, capability: string, payload: unknown): Promise<string> {
    const correlationId = crypto.randomUUID();
    await this.transport.send({ protocol: SOUL_MESH_PROTOCOL, contractVersion: SOUL_MESH_CONTRACT_VERSION, id: crypto.randomUUID(), correlationId, source: this.local, target, kind: 'event', capability, payload, timestamp: Date.now() });
    return correlationId;
  }

  /** Public ingress for HTTP/WebSocket/native adapters. */
  async ingest(message: SoulMeshMessage): Promise<void> {
    if (message.target !== this.local) return;
    await this.handle(message);
  }

  private waitForResponse(correlationId: string, send: () => Promise<void>, target: SoulNucleus, capability: string, timeoutMs = this.timeoutMs): Promise<SoulMeshMessage> {
    return new Promise<SoulMeshMessage>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(correlationId); reject(new Error(`Soul Mesh request timeout: ${target}/${capability}`)); }, timeoutMs);
      this.pending.set(correlationId, { resolve, reject, timer });
      void send().catch((error) => { clearTimeout(timer); this.pending.delete(correlationId); reject(error instanceof Error ? error : new Error(String(error))); });
    });
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
    if (message.kind === 'request') {
      const handler = message.capability ? this.handlers.get(message.capability) : undefined;
      if (!handler) {
        await this.transport.send({ protocol: SOUL_MESH_PROTOCOL, contractVersion: SOUL_MESH_CONTRACT_VERSION, id: crypto.randomUUID(), correlationId: message.correlationId, source: this.local, target: message.source, kind: 'error', capability: message.capability, payload: { error: `Capability not registered: ${message.capability ?? 'unknown'}` }, timestamp: Date.now() });
        return;
      }
      try {
        const result = await handler(message);
        await this.transport.send({ protocol: SOUL_MESH_PROTOCOL, contractVersion: SOUL_MESH_CONTRACT_VERSION, id: crypto.randomUUID(), correlationId: message.correlationId, source: this.local, target: message.source, kind: 'response', capability: message.capability, payload: result, timestamp: Date.now() });
      } catch (error) {
        await this.transport.send({ protocol: SOUL_MESH_PROTOCOL, contractVersion: SOUL_MESH_CONTRACT_VERSION, id: crypto.randomUUID(), correlationId: message.correlationId, source: this.local, target: message.source, kind: 'error', capability: message.capability, payload: { error: error instanceof Error ? error.message : String(error) }, timestamp: Date.now() });
      }
      return;
    }
    await EventBus.emit('soul:mesh:message' as never, message as never).catch(() => undefined);
  }

  close(): void { this.unsubscribe(); for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error('Soul Mesh router closed')); } this.pending.clear(); this.handlers.clear(); }
}
