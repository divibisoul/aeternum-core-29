import type { N01N02HybridLink } from '../../src/core/mesh/N01N02HybridLink';

export type N01ExternalCapabilityRequest = {
  capability: string;
  payload?: unknown;
  workloads?: unknown[];
  candidate?: Record<string, unknown>;
  strategy?: string;
};

/**
 * N01 host/runtime keeps ownership of HortaCore and device integration.
 * External capabilities are delegated to N02 through the existing N01↔N02
 * Mesh link; N02 performs the optional real N07 orbital/Prefrontal preflight.
 */
export async function delegateN01ExternalCapability(
  link: N01N02HybridLink,
  request: N01ExternalCapabilityRequest,
): Promise<unknown> {
  const capability = request.capability.trim();
  if (!capability) throw new Error('N01_EXTERNAL_CAPABILITY_REQUIRED');

  const result = await link.requestN02(capability, {
    payload: request.payload ?? {},
    metadata: {
      prefrontal_orbital: 'true',
      workloads_json: JSON.stringify(request.workloads ?? []),
      candidate_json: JSON.stringify(request.candidate ?? { capability }),
      strategy: request.strategy ?? 'n01-external-tool-preflight',
    },
  });

  return result.payload;
}
