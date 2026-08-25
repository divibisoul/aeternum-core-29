/**
 * Shared protocol for the six Soul cores.
 * A core may publish capabilities and consume capabilities from any other core.
 * The protocol is transport-neutral: EventBus, WebView bridge, HTTP, IPC or
 * another adapter may carry the envelope without changing the contract.
 */
export type SoulCoreId =
  | 'aeternum-core'
  | 'soul-sentinel'
  | 'nexus-aeternum-fusion'
  | 'eternium'
  | 'nextjs-ai-chatbot'
  | 'nextjs-ai-chatbot-variants';

export type SoulMessageKind = 'capability:announce' | 'capability:request' | 'capability:result' | 'event' | 'context';

export interface SoulMeshEnvelope<T = unknown> {
  protocol: 'soul-mesh/1';
  messageId: string;
  correlationId: string;
  source: SoulCoreId;
  target: SoulCoreId | '*';
  kind: SoulMessageKind;
  capability?: string;
  timestamp: number;
  payload: T;
}

export interface SoulCapabilityDescriptor {
  id: string;
  version: string;
  description: string;
  input: string;
  output: string;
  providers: SoulCoreId[];
}

export interface SoulCapabilityRequest {
  capability: string;
  input: unknown;
  context?: Record<string, unknown>;
}

export interface SoulCapabilityResult {
  success: boolean;
  output?: unknown;
  error?: { code: string; message: string };
}

export function createSoulMessage<T>(
  source: SoulCoreId,
  target: SoulCoreId | '*',
  kind: SoulMessageKind,
  payload: T,
  options: { capability?: string; correlationId?: string } = {},
): SoulMeshEnvelope<T> {
  return {
    protocol: 'soul-mesh/1',
    messageId: crypto.randomUUID(),
    correlationId: options.correlationId ?? crypto.randomUUID(),
    source,
    target,
    kind,
    capability: options.capability,
    timestamp: Date.now(),
    payload,
  };
}
