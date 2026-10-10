const N02_OWNED_CAPABILITIES = new Set([
  'ai.generate',
  'ai.multimodal',
  'cognitive-processing',
]);

/**
 * Resolve an N01 gateway route while preserving capability ownership.
 *
 * Exact N02-owned capabilities take precedence over dynamic peer advertisements.
 * Dynamic registrations remain available for all other capabilities, followed by
 * the historical namespace fallbacks. A route decision is not live-connectivity
 * evidence; the caller still checks the target URL and authenticates the request.
 */
export function resolveCapabilityOwner(capability, peers) {
  if (typeof capability !== 'string' || !capability.trim()) return null;
  if (capability === 'inference.intent') return 'N01';
  if (capability.startsWith('clareira.')) return 'N01';

  if (N02_OWNED_CAPABILITIES.has(capability)) return 'N02';

  for (const peer of peers.values()) {
    if (Array.isArray(peer.capabilities) && peer.capabilities.includes(capability)) {
      return peer.id;
    }
  }

  if (capability.startsWith('inference.') || capability.startsWith('conversation.')) return 'N02';
  if (capability.startsWith('audio.') || capability.startsWith('speech.') || capability.startsWith('multimodal.')) return 'N03';
  if (capability.startsWith('document.') || capability.startsWith('tool:') || capability.startsWith('tool.') || capability.startsWith('artifact.')) return 'N04';
  if (capability.startsWith('orchestration.') || capability.startsWith('dispatch.')) return 'N05';
  if (capability.startsWith('pilot.') || capability.startsWith('cognitive.') || capability.startsWith('support.')) return 'N06';
  return null;
}
