// Publicly reachable N07 calls stay structural. The two external federation
// operations are the only additional entries: they require the N01 server-side
// HMAC relay and N07 still enforces per-provider opt-in, source pin and fail-closed execution.
export const N07_PUBLIC_STRUCTURAL_CAPABILITIES = Object.freeze([
  'mesh.ping',
  'external.federation.describe@1.0.0',
  'external.federation.execute@1.0.0',
]);

export function isPublicN07StructuralCapability(capability) {
  return typeof capability === 'string' &&
    N07_PUBLIC_STRUCTURAL_CAPABILITIES.includes(capability.trim());
}
