/** Soul Mesh v1: canonical wire contract shared by all six AI nuclei. */
export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;
export const SOUL_NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'] as const;
export type SoulNucleus = typeof SOUL_NUCLEI[number];
export type SoulMeshKind = 'request' | 'response' | 'event' | 'error' | 'ack';

/** Timestamp accepts epoch milliseconds or ISO-8601 for Android/native interoperability. */
export interface SoulMeshMessage<T = unknown> {
  protocol: typeof SOUL_MESH_PROTOCOL;
  id: string;
  correlationId: string;
  source: SoulNucleus;
  target: SoulNucleus;
  kind: SoulMeshKind;
  capability?: string;
  payload: T;
  timestamp: number | string;
}

export interface SoulMeshTransport {
  send(message: SoulMeshMessage): Promise<void>;
  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void;
}

export function isSoulNucleus(value: unknown): value is SoulNucleus {
  return typeof value === 'string' && (SOUL_NUCLEI as readonly string[]).includes(value);
}

export function createSoulMeshMessage<T>(input: Omit<SoulMeshMessage<T>, 'protocol' | 'id' | 'timestamp'>): SoulMeshMessage<T> {
  return { protocol: SOUL_MESH_PROTOCOL, id: crypto.randomUUID(), timestamp: Date.now(), ...input };
}

export function isSoulMeshMessage(value: unknown): value is SoulMeshMessage {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  const validTimestamp = (typeof m.timestamp === 'number' && Number.isFinite(m.timestamp))
    || (typeof m.timestamp === 'string' && !Number.isNaN(Date.parse(m.timestamp)));
  return m.protocol === SOUL_MESH_PROTOCOL
    && typeof m.id === 'string'
    && typeof m.correlationId === 'string'
    && isSoulNucleus(m.source)
    && isSoulNucleus(m.target)
    && m.source !== m.target
    && typeof m.kind === 'string'
    && ['request', 'response', 'event', 'error', 'ack'].includes(m.kind)
    && validTimestamp;
}
