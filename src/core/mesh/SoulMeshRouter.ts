import type { SoulMeshMessage, SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
import { createSoulMeshMessage, isSoulMeshMessage } from './SoulMeshProtocol';
import { EventBus } from '../EventBus';

export type SoulMeshRequestHandler = (message: SoulMeshMessage) => unknown | Promise<unknown>;

const DEFAULT_TIMEOUT_MS = 30000;
const MAX_TIMEOUT_MS = 60000;

function boundedTimeout(value: number): number {
  return Math.min(MAX_TIMEOUT_MS, Math.max(1000, Math.floor(value)));
}

/** Bidirectional nucleus router. N01 routes only; the target nucleus owns and executes its capability. */
export class SoulMeshRouter {
  private readonly pending = new Map<string, { resolve: (message: SoulMeshMessage) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private readonly handlers = new Map<string, SoulMeshRequestHandler>();
  private readonly unsubscribe: () => void;
  private readonly timeoutMs: number;

  constructor(private readonly transport: SoulMeshTransport, private readonly local: SoulNucleus, timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.timeoutMs = boundedTimeout(timeoutMs);
    this.unsubscribe = transport.onMessage(async (message) => this.handle(message));
  }

  async request<T = unknown>(target: SoulNucleus, capability: string, payload: T): Promise<SoulMeshMessage> {
    if (target === this.local) throw new Error('SOUL_MESH_SELF_ROUTE_NOT_ALLOWED');
    if (!capability.trim()) throw new Error('SOUL_MESH_CAPABILITY_REQUIRED');
    const message = createSoulMeshMessage({ source: this.local, target, kind: 'request', correlationId: crypto.randomUUID(), capability, payload });
    if (!isSoulMeshMessage(message)) throw new Error('SOUL_MESH_INVALID_OUTBOUND_MESSAGE');
    return new Promise<SoulMeshMessage>((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(message.correlationId); reject(new Error(`Soul Mesh request timeout: ${target}/${capability}`)); }, this.timeoutMs);
      this.pending.set(message.correlationId, { resolve, reject, timer });
      void this.transport.send(message).catch((error) => { clearTimeout(timer); this.pending.delete(message.correlationId); reject(error instanceof Error ? error : new Error(String(error))); });
    });
  }

  onRequest(capability: string, handler: SoulMeshRequestHandler): () => void {
    if (!capability.trim()) throw new Error('SOUL_MESH_CAPABILITY_REQUIRED');
    this.handlers.set(capability, handler);
    return () => { if (this.handlers.get(capability) === handler) this.handlers.delete(capability); };
  }

  async sendEvent(target: SoulNucleus, capability: string, payload: unknown): Promise<void> {
    if (target === this.local) throw new Error('SOUL_MESH_SELF_ROUTE_NOT_ALLOWED');
    const message = createSoulMeshMessage({ source: this.local, target, kind: 'event', correlationId: crypto.randomUUID(), capability, payload });
    if (!isSoulMeshMessage(message)) throw new Error('SOUL_MESH_INVALID_OUTBOUND_MESSAGE');
    await this.transport.send(message);
  }

  private async reply(message: SoulMeshMessage, kind: 'response' | 'error', payload: unknown): Promise<void> {
    const response = createSoulMeshMessage({ source: this.local, target: message.source, kind, correlationId: message.correlationId, capability: message.capability, payload });
    await this.transport.send(response);
  }

  private async handle(message: SoulMeshMessage): Promise<void> {
    if (!isSoulMeshMessage(message) || message.target !== this.local || message.source === this.local) return;
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
        await this.reply(message, 'error', { error: `Capability not registered: ${message.capability ?? 'unknown'}` });
        return;
      }
      try {
        await this.reply(message, 'response', await handler(message));
      } catch (error) {
        await this.reply(message, 'error', { error: error instanceof Error ? error.message : String(error) });
      }
      return;
    }
    await EventBus.emit('soul:mesh:message' as never, message as never).catch(() => undefined);
  }

  close(): void {
    this.unsubscribe();
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.reject(new Error('Soul Mesh router closed')); }
    this.pending.clear();
    this.handlers.clear();
  }
}
