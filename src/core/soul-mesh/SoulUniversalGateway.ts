/**
 * User-facing gateway for the hybrid APK.
 * N01 is the access point, not the owner of every capability. Ownership and
 * execution remain in the nucleus registry; this gateway only dispatches.
 */
import type { SoulMeshMessage, SoulNucleus } from '../mesh/SoulMeshProtocol';

export interface SoulCapabilityBinding {
  owner: SoulNucleus;
  execute(message: SoulMeshMessage): Promise<SoulMeshMessage>;
}

export interface SoulGatewayResult {
  message: SoulMeshMessage;
  owner: SoulNucleus;
}

export class SoulUniversalGateway {
  private readonly bindings = new Map<string, SoulCapabilityBinding>();

  register(capability: string, binding: SoulCapabilityBinding): () => void {
    if (!capability.trim()) throw new Error('INVALID_CAPABILITY');
    this.bindings.set(capability, binding);
    return () => {
      if (this.bindings.get(capability) === binding) this.bindings.delete(capability);
    };
  }

  async dispatch(message: SoulMeshMessage): Promise<SoulGatewayResult> {
    if (message.source !== 'N01') throw new Error('APK_GATEWAY_SOURCE_MUST_BE_N01');
    const binding = message.capability ? this.bindings.get(message.capability) : undefined;
    if (!binding) throw new Error(`CAPABILITY_NOT_REGISTERED: ${message.capability ?? 'unknown'}`);
    if (binding.owner === 'N01') return { message: await binding.execute(message), owner: binding.owner };
    const forwarded: SoulMeshMessage = { ...message, source: 'N01', target: binding.owner };
    return { message: await binding.execute(forwarded), owner: binding.owner };
  }

  listCapabilities(): string[] {
    return [...this.bindings.keys()].sort();
  }
}
