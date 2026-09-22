/**
 * Shared transversal message envelope for the NVOD / Vagus fusion layer.
 *
 * This contract is ADDITIVE. It does not replace `SoulMeshMessage`
 * (src/core/mesh/SoulMeshProtocol.ts), which remains the canonical
 * inter-nucleus wire contract. This envelope is the INTERNAL N01 fusion
 * envelope used between the fabric and the processors, and it is mapped
 * onto the canonical Soul Mesh message at the nucleus boundary.
 */

export const NVOD_FUSION_PROTOCOL = 'nvod-fusion/1' as const;
export const NVOD_FUSION_CONTRACT_VERSION = '1.0.0' as const;

export type FusionPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type FusionKind = 'request' | 'response' | 'event' | 'error';

export const FUSION_PRIORITY_WEIGHT: Record<FusionPriority, number> = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
};

export interface FusionEnvelope<T = unknown> {
  protocol: typeof NVOD_FUSION_PROTOCOL;
  contractVersion: typeof NVOD_FUSION_CONTRACT_VERSION;
  /** Unique identity of this message. */
  id: string;
  /** Stable identity of the request/reply conversation. */
  correlationId: string;
  /** The message id that caused this message to exist, when applicable. */
  causationId?: string;
  /** Stable identity of the whole distributed operation. */
  traceId: string;
  source: string;
  target?: string;
  capability: string;
  kind: FusionKind;
  priority: FusionPriority;
  /** Absolute epoch millis after which the message must not be executed. */
  deadlineAt?: number;
  timestamp: number;
  payload: T;
}

export interface CreateFusionEnvelopeInput<T> {
  source: string;
  capability: string;
  payload: T;
  target?: string;
  kind?: FusionKind;
  priority?: FusionPriority;
  correlationId?: string;
  causationId?: string;
  traceId?: string;
  timeoutMs?: number;
  now?: number;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  throw new Error('NVOD_CRYPTO_RANDOM_UUID_UNAVAILABLE');
}

export function createFusionEnvelope<T>(input: CreateFusionEnvelopeInput<T>): FusionEnvelope<T> {
  if (!input.source.trim()) throw new Error('NVOD_ENVELOPE_SOURCE_REQUIRED');
  if (!input.capability.trim()) throw new Error('NVOD_ENVELOPE_CAPABILITY_REQUIRED');
  const now = input.now ?? Date.now();
  const id = newId();
  return {
    protocol: NVOD_FUSION_PROTOCOL,
    contractVersion: NVOD_FUSION_CONTRACT_VERSION,
    id,
    correlationId: input.correlationId?.trim() || id,
    causationId: input.causationId,
    traceId: input.traceId?.trim() || id,
    source: input.source,
    target: input.target,
    capability: input.capability,
    kind: input.kind ?? 'request',
    priority: input.priority ?? 'NORMAL',
    deadlineAt: input.timeoutMs !== undefined ? now + input.timeoutMs : undefined,
    timestamp: now,
    payload: input.payload,
  };
}

/** Builds a reply that is provably correlated to its request. */
export function deriveFusionReply<T>(
  request: FusionEnvelope,
  payload: T,
  kind: 'response' | 'error' = 'response',
  source = request.target ?? request.source,
  now = Date.now(),
): FusionEnvelope<T> {
  return {
    protocol: NVOD_FUSION_PROTOCOL,
    contractVersion: NVOD_FUSION_CONTRACT_VERSION,
    id: newId(),
    correlationId: request.correlationId,
    causationId: request.id,
    traceId: request.traceId,
    source,
    target: request.source,
    capability: request.capability,
    kind,
    priority: request.priority,
    deadlineAt: request.deadlineAt,
    timestamp: now,
    payload,
  };
}

export function isFusionEnvelope(value: unknown): value is FusionEnvelope {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return (
    m.protocol === NVOD_FUSION_PROTOCOL &&
    m.contractVersion === NVOD_FUSION_CONTRACT_VERSION &&
    typeof m.id === 'string' && m.id.length > 0 &&
    typeof m.correlationId === 'string' && m.correlationId.length > 0 &&
    typeof m.traceId === 'string' && m.traceId.length > 0 &&
    typeof m.source === 'string' && m.source.length > 0 &&
    typeof m.capability === 'string' && m.capability.length > 0 &&
    ['request', 'response', 'event', 'error'].includes(m.kind as string) &&
    typeof m.priority === 'string' && m.priority in FUSION_PRIORITY_WEIGHT &&
    typeof m.timestamp === 'number' && Number.isFinite(m.timestamp)
  );
}

export function isExpired(envelope: FusionEnvelope, now = Date.now()): boolean {
  return envelope.deadlineAt !== undefined && now > envelope.deadlineAt;
}

export function comparePriority(a: FusionEnvelope, b: FusionEnvelope): number {
  const byPriority = FUSION_PRIORITY_WEIGHT[b.priority] - FUSION_PRIORITY_WEIGHT[a.priority];
  return byPriority !== 0 ? byPriority : a.timestamp - b.timestamp;
}
