import type { NexusCapability, NexusInteractionRequest, NexusInteractionResult } from '../contracts/NexusCapabilityContract';
import { EventBus } from '../EventBus';

/**
 * Core-side adapter for Nexus. It registers interaction capabilities and
 * routes results into the same EventBus used by the Soul core.
 */
export class NexusSoulBridge {
  private readonly capabilities = new Set<NexusCapability>();

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
