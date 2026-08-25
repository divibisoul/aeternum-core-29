import type { NexusCapability, NexusInteractionRequest, NexusInteractionResult } from '../contracts/NexusCapabilityContract';
import { EventBus } from '../EventBus';

/** Core-side transport adapter for Nexus capabilities. */
export class NexusSoulBridge {
  private readonly capabilities = new Set<NexusCapability>();
  private started = false;

  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    window.addEventListener('soul:nexus:capabilities', (event) => {
      const descriptors = (event as CustomEvent<Array<{ id: NexusCapability; available: boolean }>>).detail ?? [];
      for (const descriptor of descriptors) this.register(descriptor);
    });
    window.addEventListener('soul:nexus:result', (event) => {
      const result = (event as CustomEvent<NexusInteractionResult>).detail;
      if (result) this.acceptResult(result);
    });
  }

  register(descriptor: { id: NexusCapability; available: boolean }): void {
    if (descriptor.available) this.capabilities.add(descriptor.id);
    else this.capabilities.delete(descriptor.id);
    EventBus.emit('module:activated', { id: `nexus:${descriptor.id}` });
  }

  has(capability: NexusCapability): boolean {
    return this.capabilities.has(capability);
  }

  request(capability: NexusCapability, input: unknown, context?: Record<string, unknown>): NexusInteractionRequest {
    const request: NexusInteractionRequest = {
      version: 1,
      requestId: crypto.randomUUID(),
      capability,
      input,
      context,
    };
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('soul:nexus:request', { detail: request }));
    }
    EventBus.emit('chat:send', { message: JSON.stringify({ source: 'nexus', request }) });
    return request;
  }

  acceptResult(result: NexusInteractionResult): void {
    if (!result.success) {
      EventBus.emit('system:error', { error: result.error?.message ?? 'Nexus capability failed', context: `nexus:${result.capability}` });
      return;
    }
    EventBus.emit('chat:response', { message: JSON.stringify({ source: 'nexus', result }) });
  }
}

export const nexusSoulBridge = new NexusSoulBridge();
