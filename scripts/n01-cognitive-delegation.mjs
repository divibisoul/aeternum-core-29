import { recallSoulMemories } from './supabase-vector-memory.mjs';

function correlation(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : crypto.randomUUID();
}

export async function buildCognitiveDelegationPayload(input = {}, correlationId) {
  const source = input && typeof input === 'object' ? input : {};
  const requestText = typeof source.text === 'string' ? source.text : (typeof source.prompt === 'string' ? source.prompt : (typeof source.query === 'string' ? source.query : ''));
  const memoryContext = Array.isArray(source.memoryContext)
    ? source.memoryContext
    : await recallSoulMemories({ text: requestText, apiKey: source.apiKey, sessionId: source.sessionId });

  return {
    ...source,
    memoryContext: Array.isArray(memoryContext) ? memoryContext : [],
    compositionPermission: {
      enabled: true,
      scope: ['mesh.capability.resolve'],
      allowDerivedCapabilityComposition: true,
      source: 'N01',
    },
    correlationId: correlation(correlationId || source.correlationId),
  };
}
