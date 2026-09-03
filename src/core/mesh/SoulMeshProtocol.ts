/** Canonical Soul Mesh wire contract. Provider/framework neutral and shared by all seven nuclei. */
export const SOUL_MESH_PROTOCOL = 'soul-mesh/1' as const;
export const SOUL_MESH_CONTRACT_VERSION = '1.1.0' as const;
export const SOUL_NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07'] as const;
export type SoulNucleus = typeof SOUL_NUCLEI[number];
export type SoulMeshKind = 'request' | 'response' | 'event' | 'error' | 'ack';
export type SoulMeshTransportKind = 'IN_PROCESS' | 'WEBVIEW_BRIDGE' | 'LOOPBACK_HTTP' | 'HTTP' | 'REALTIME';
export interface SoulMeshMeta { runtime?: string; transport?: SoulMeshTransportKind; encoding?: string; version?: string; nonce?: string; traceId?: string; }
export interface SoulMeshMessage<T = unknown> { protocol: typeof SOUL_MESH_PROTOCOL; contractVersion: typeof SOUL_MESH_CONTRACT_VERSION; id: string; correlationId: string; source: SoulNucleus; target: SoulNucleus; kind: SoulMeshKind; capability?: string; payload: T; timestamp: number; transport?: SoulMeshTransportKind; meta?: SoulMeshMeta; }
export interface SoulMeshTransport { send(message: SoulMeshMessage): Promise<void>; onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void; }
const MAX_ID_LENGTH = 200;
const MAX_CAPABILITY_LENGTH = 200;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
export function isSoulNucleus(value: unknown): value is SoulNucleus { return typeof value === 'string' && (SOUL_NUCLEI as readonly string[]).includes(value); }
export function createSoulMeshMessage<T>(input: Omit<SoulMeshMessage<T>, 'protocol' | 'contractVersion' | 'id' | 'timestamp'>): SoulMeshMessage<T> { const id = crypto.randomUUID(); return { protocol: SOUL_MESH_PROTOCOL, contractVersion: SOUL_MESH_CONTRACT_VERSION, id, timestamp: Date.now(), correlationId: input.correlationId || id, ...input }; }
export function isSoulMeshMessage(value: unknown): value is SoulMeshMessage {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  if (m.protocol !== SOUL_MESH_PROTOCOL || m.contractVersion !== SOUL_MESH_CONTRACT_VERSION) return false;
  if (typeof m.id !== 'string' || !m.id || m.id.length > MAX_ID_LENGTH) return false;
  if (typeof m.correlationId !== 'string' || !m.correlationId || m.correlationId.length > MAX_ID_LENGTH) return false;
  if (!isSoulNucleus(m.source) || !isSoulNucleus(m.target) || m.source === m.target) return false;
  if (!['request', 'response', 'event', 'error', 'ack'].includes(m.kind as string)) return false;
  if ((m.kind === 'request' || m.kind === 'response' || m.kind === 'error') && (typeof m.capability !== 'string' || !m.capability.trim() || m.capability.length > MAX_CAPABILITY_LENGTH)) return false;
  if (typeof m.timestamp !== 'number' || !Number.isFinite(m.timestamp) || Math.abs(Date.now() - m.timestamp) > MAX_CLOCK_SKEW_MS) return false;
  return 'payload' in m;
}
