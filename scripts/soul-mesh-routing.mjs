const N02_OWNED_CAPABILITIES = new Set([
  'mesh.handshake',
  'mesh.peer.ping',
  'cognitive-processing',
  'ai.generate',
  'gemini.google_search',
  'gemini.code_execution',
  'gemini.url_context',
  'gemini.file_search',
  'gemini.google_maps',
  'inference.reason',
  'ai.multimodal',
  'acai',
  'mpvs',
  'neural_forge',
  'asc',
  'einstein_code',
  'ai.generate.ollama',
  'neural.bnc_v2',
  'cognitive.csae',
  'resource.dcrs',
  'octacore.execute',
  'mesh.describe',
  'multimodal_cortex',
  'autonomous_embodiment',
  'biomolecular_designer',
  'reality_synthesis',
  'strategic_planning',
  'adaptation_module',
  'scre',
  'ecas',
  'eus',
  'mlfg',
  'emergent_cognition',
  'skill_acquisition',
  'uci',
  'ethical_governance',
  'strategic_defense',
  'existential_safety',
  'einstein_reasoning',
  'einstein_quantum',
  'cot_arhd',
  'cot_drc',
  'cot_area',
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
