import {
  createEnvelope as createCanonicalEnvelope,
  signEnvelope as signCanonicalEnvelope,
  verifyEnvelope as verifyCanonicalEnvelope,
  type SoulMeshEnvelope,
} from '../../../lib/soul-mesh/SoulMeshEnvelope.ts';

export type { SoulMeshEnvelope };

const encoder = new TextEncoder();

/**
 * Compatibility facade for the canonical Mesh envelope implementation.
 * The wire authority lives in lib/soul-mesh/SoulMeshEnvelope.ts; this module
 * preserves the historical src/core/soul import boundary without duplicating logic.
 */
export async function signEnvelope<T>(
  envelope: Omit<SoulMeshEnvelope<T>, 'hmac'>,
  secret: string,
): Promise<SoulMeshEnvelope<T>> {
  if (typeof secret !== 'string' || secret.length < 16) {
    throw new Error('HMAC secret must contain at least 16 characters');
  }
  return signCanonicalEnvelope(envelope, encoder.encode(secret));
}

/** Verify the canonical envelope while keeping the historical numeric `now` argument. */
export async function verifyEnvelope<T>(
  envelope: SoulMeshEnvelope<T>,
  secret: string,
  now = Date.now(),
): Promise<boolean> {
  if (typeof secret !== 'string' || secret.length < 16) {
    throw new Error('HMAC secret must contain at least 16 characters');
  }
  return verifyCanonicalEnvelope(envelope, encoder.encode(secret), {
    nowMs: now,
    maxClockSkewMs: 30 * 1000,
    requireContractVersion: true,
  });
}

/** Create and sign a canonical envelope, preserving the historical helper signature. */
export async function createEnvelope<T>(
  input: Omit<SoulMeshEnvelope<T>, 'version' | 'contractVersion' | 'messageId' | 'timestamp' | 'nonce' | 'hmac'>,
  secret: string,
): Promise<SoulMeshEnvelope<T>> {
  const unsigned = createCanonicalEnvelope(input);
  return signEnvelope(unsigned, secret);
}

export { createCanonicalEnvelope as createUnsignedEnvelope };
