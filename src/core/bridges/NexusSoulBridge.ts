import type { NexusCapability, NexusInteractionRequest, NexusInteractionResult } from '../contracts/NexusCapabilityContract';
import { EventBus } from '../EventBus';

/** Bidirectional transport adapter between Aeternum Core and Nexus. */
export class NexusSoulBridge {
  private readonly capabilities = new Set<NexusCapability>();
  private readonly pending = new Map<string, NexusInteractionRequest>();
  private started = false;

  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    window.addEventListener('soul:nexus:capabilities', (event) => {
      const descriptors = (event as CustomEvent<Array<{ id: NexusCapability; available: boolean }>>).detail ?? [];
      for (const descriptor of descriptors) this.register(descriptor);
      EventBus.emit('system:status', { status: 'nexus-capabilities-updated' });
    });
    window.addEventListener('soul:nexus:result', (event) => {
      const result = (event as CustomEvent<NexusInteractionResult>).detail;
      if (result) this.acceptResult(result);
    });
    window.addEventListener('soul:nexus:event', (event) => {
      const payload = (event as CustomEvent<{ type: string; data?: unknown }>).detail;
      if (!payload?.type) return;
      EventBus.emit('system:status', { status: `nexus-event:${payload.type}` });
      EventBus.emit('chat:response', { message: JSON.stringify({ source: 'nexus-event', ...payload }) });
    });
    window.dispatchEvent(new CustomEvent('soul:nexus:hello', { detail: { version: 1, source: 'aeternum-core' } }));
  }

  register(descriptor: { id: NexusCapability; available: boolean }): void {
    if (descriptor.available) this.capabilities.add(descriptor.id);
    else this.capabilities.delete(descriptor.id);
    EventBus.emit('module:activated', { id: `nexus:${descriptor.id}` });
  }

  has(capability: NexusCapability): boolean { return this.capabilities.has(capability); }

  request(capability: NexusCapability, input: unknown, context?: Record<string, unknown>): NexusInteractionRequest {
    const request: NexusInteractionRequest = {
      version: 1,
      requestId: crypto.randomUUID(),
      capability,
      input,
      context,
    };
    this.pending.set(request.requestId, request);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('soul:nexus:request', { detail: request }));
    }
    EventBus.emit('chat:send', { message: JSON.stringify({ source: 'nexus', request }) });
    return request;
  }

  acceptResult(result: NexusInteractionResult): void {
    this.pending.delete(result.requestId);
    if (!result.success) {
      EventBus.emit('system:error', { error: result.error?.message ?? 'Nexus capability failed', context: `nexus:${result.capability}` });
      return;
    }
    EventBus.emit('chat:response', { message: JSON.stringify({ source: 'nexus', result }) });
  }
}

export const nexusSoulBridge = new NexusSoulBridge();
