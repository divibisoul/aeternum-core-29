import type { SoulMeshEnvelope } from './SoulMeshEnvelope';
import { verifyEnvelope } from './SoulMeshEnvelope';

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const seenNonces = new Map<string, number>();

export function isFreshEnvelope(message: SoulMeshEnvelope, now = Date.now()): boolean {
  const age = Math.abs(now - message.timestamp);
  const ttl = message.ttl ?? MAX_CLOCK_SKEW_MS;
  return age <= Math.min(ttl, MAX_CLOCK_SKEW_MS);
}

export async function verifyAndReplayProtect(message: SoulMeshEnvelope, secret: string, now = Date.now()): Promise<boolean> {
  if (!isFreshEnvelope(message, now)) return false;
  const previous = seenNonces.get(message.nonce);
  if (previous !== undefined && previous > now) return false;
  const valid = await verifyEnvelope(message, secret, now);
  if (valid) seenNonces.set(message.nonce, now + (message.ttl ?? MAX_CLOCK_SKEW_MS));
  for (const [nonce, until] of seenNonces) if (until <= now) seenNonces.delete(nonce);
  return valid;
}
