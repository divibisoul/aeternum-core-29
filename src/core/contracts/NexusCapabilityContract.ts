/**
 * Connection 2 contract: Nexus -> Aeternum Core.
 * Nexus supplies interaction capabilities; Core remains the orchestrator.
 * This contract deliberately does not expose Android system APIs.
 */
export type NexusCapability =
  | 'voice-input'
  | 'voice-output'
  | 'multimodal-input'
  | 'cognitive-ui'
  | 'speech-processing';

export interface NexusCapabilityDescriptor {
  id: NexusCapability;
  available: boolean;
  version: 1;
  provider: 'nexus-aeternum-fusion';
}

export interface NexusInteractionRequest {
  version: 1;
  requestId: string;
  capability: NexusCapability;
  input: unknown;
  context?: Record<string, unknown>;
}

export interface NexusInteractionResult {
  version: 1;
  requestId: string;
  capability: NexusCapability;
  success: boolean;
  output?: unknown;
  error?: { code: string; message: string };
}

export function isNexusInteractionResult(value: unknown): value is NexusInteractionResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 && typeof v.requestId === 'string' &&
    typeof v.capability === 'string' && typeof v.success === 'boolean';
}
