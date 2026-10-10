export const N07_PUBLIC_STRUCTURAL_CAPABILITIES = Object.freeze(['mesh.ping']);

export function isPublicN07StructuralCapability(capability) {
  return typeof capability === 'string' &&
    N07_PUBLIC_STRUCTURAL_CAPABILITIES.includes(capability.trim());
}
