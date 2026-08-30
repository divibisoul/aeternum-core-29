import crypto from 'node:crypto';
import { recallSoulMemories } from './supabase-vector-memory.mjs';

const MAX_MEMORY_ITEMS = 8;
const MAX_MEMORY_CONTENT_LENGTH = 4_000;

function correlation(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : crypto.randomUUID();
}

function sanitizeMemoryContext(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_MEMORY_ITEMS).map((memory) => ({
    id: typeof memory?.id === 'string' ? memory.id : undefined,
    nucleus_id: typeof memory?.nucleus_id === 'string' ? memory.nucleus_id : undefined,
    agent_id: typeof memory?.agent_id === 'string' ? memory.agent_id : null,
    session_id: typeof memory?.session_id === 'string' ? memory.session_id : null,
    content: typeof memory?.content === 'string' ? memory.content.slice(0, MAX_MEMORY_CONTENT_LENGTH) : '',
    memory_type: typeof memory?.memory_type === 'string' ? memory.memory_type : 'episodic',
    metadata: memory?.metadata && typeof memory.metadata === 'object' && !Array.isArray(memory.metadata) ? memory.metadata : {},
    importance: Number.isFinite(Number(memory?.importance)) ? Number(memory.importance) : 0,
    confidence: Number.isFinite(Number(memory?.confidence)) ? Number(memory.confidence) : 0,
    similarity: Number.isFinite(Number(memory?.similarity)) ? Number(memory.similarity) : 0,
    created_at: typeof memory?.created_at === 'string' ? memory.created_at : null,
  }));
}

export async function buildCognitiveDelegationPayload(input = {}, correlationId) {
  const source = input && typeof input === 'object' ? input : {};
  const requestText = typeof source.text === 'string' ? source.text : (typeof source.prompt === 'string' ? source.prompt : (typeof source.query === 'string' ? source.query : ''));
  const retrievedMemory = Array.isArray(source.memoryContext)
    ? source.memoryContext
    : await recallSoulMemories({ text: requestText, apiKey: source.apiKey, sessionId: source.sessionId });
  const { apiKey: _apiKey, ...safeSource } = source;
  const requestCorrelationId = correlation(correlationId || source.correlationId);

  return {
    ...safeSource,
    memoryContext: sanitizeMemoryContext(retrievedMemory),
    compositionPermission: {
      enabled: true,
      scope: ['mesh.capability.resolve'],
      allowDerivedCapabilityComposition: true,
      source: 'N01',
      correlationId: requestCorrelationId,
    },
    correlationId: requestCorrelationId,
  };
}
