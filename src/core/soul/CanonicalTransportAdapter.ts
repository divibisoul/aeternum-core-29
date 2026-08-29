import { verifyEnvelope, type SoulMeshEnvelope } from './SoulMeshEnvelope';
import type { TransportKind } from '../../../lib/soul-mesh/HybridTransportRegistry';

export interface CanonicalTransportFrame<T = unknown> {
  envelope: SoulMeshEnvelope<T>;
  transport: TransportKind;
}

const BIDIRECTIONAL_TRANSPORTS: readonly TransportKind[] = [
  'IN_PROCESS',
  'WEBVIEW_BRIDGE',
  'LOOPBACK_HTTP',
  'HTTP',
  'REALTIME',
];

/** Validates the existing v1.0 envelope before a transport adapter accepts it. */
export async function acceptCanonicalEnvelope<T>(
  envelope: SoulMeshEnvelope<T>,
  secret: string,
  now = Date.now(),
): Promise<SoulMeshEnvelope<T>> {
  if (!(await verifyEnvelope(envelope, secret, now))) {
    throw new Error('INVALID_SOUL_MESH_ENVELOPE');
  }
  return envelope;
}

/** Resolves a common bidirectional transport while leaving the existing registry intact. */
export function resolveCanonicalTransport(
  local: readonly TransportKind[],
  remote: readonly TransportKind[],
): TransportKind {
  for (const transport of BIDIRECTIONAL_TRANSPORTS) {
    if (local.includes(transport) && remote.includes(transport)) return transport;
  }
  throw new Error('NO_COMPATIBLE_BIDIRECTIONAL_TRANSPORT');
}

/** Emits the unchanged canonical envelope through the selected transport. */
export function frameCanonicalEnvelope<T>(
  envelope: SoulMeshEnvelope<T>,
  transport: TransportKind,
): CanonicalTransportFrame<T> {
  if (!BIDIRECTIONAL_TRANSPORTS.includes(transport)) {
    throw new Error(`UNSUPPORTED_TRANSPORT:${transport}`);
  }
  return { envelope, transport };
}
