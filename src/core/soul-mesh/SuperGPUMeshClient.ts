import { sendTo, type SoulMeshMessage } from './peerClient';

export const N01_SUPERGPU_MESH_CAPABILITY = 'mesh.supergpu.execute@1.0.0' as const;

export async function requestN07SuperGPU(
  values: number[],
  operation = 'identity',
  device?: string,
  timeoutMs = 15_000,
  correlationId?: string,
): Promise<SoulMeshMessage> {
  if (!Array.isArray(values) || values.length === 0 || values.some(value => !Number.isFinite(value))) {
    throw new Error('SUPERGPU_VALUES_INVALID');
  }
  if (!operation.trim()) throw new Error('SUPERGPU_OPERATION_REQUIRED');
  const payload = values.slice();
  return sendTo(
    'N07',
    N01_SUPERGPU_MESH_CAPABILITY,
    payload,
    timeoutMs,
    correlationId,
  );
}
