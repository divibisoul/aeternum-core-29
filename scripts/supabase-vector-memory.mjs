import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
const DIMENSIONS = 768;
const TIMEOUT_MS = Math.max(1000, Number(process.env.SOUL_MEMORY_TIMEOUT_MS || 8000));

function env(name) { return typeof process.env[name] === 'string' ? process.env[name].trim() : ''; }
function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)); }

function resolveSupabaseKey() {
  return env('SUPABASE_SECRET_KEY') || env('SUPABASE_SERVICE_ROLE_KEY') || env('SUPABASE_ANON_KEY');
}

function client() {
  try {
    const url = env('SUPABASE_URL');
    const key = resolveSupabaseKey();
    if (!url || !key) return null;
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) }) },
    });
  } catch {
    return null;
  }
}

async function embed(text, apiKey) {
  try {
    if (!apiKey || !text?.trim()) return null;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.embedContent({
      model: DEFAULT_MODEL,
      contents: text,
      config: { outputDimensionality: DIMENSIONS },
    });
    const values = response.embeddings?.[0]?.values;
    if (!Array.isArray(values) || values.length !== DIMENSIONS) return null;
    return values.map(Number);
  } catch {
    return null;
  }
}

export async function recallSoulMemories({ text, apiKey, sessionId, threshold = 0.70, limit = 8 } = {}) {
  try {
    const input = typeof text === 'string' ? text.trim() : '';
    const key = typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : env('GEMINI_API_KEY');
    if (!input || !key) return [];
    const supabase = client();
    if (!supabase) return [];
    const vector = await embed(input, key);
    if (!vector) return [];
    const { data, error } = await supabase.rpc('match_soul_memories', {
      query_embedding: vector,
      match_threshold: clamp(Number(threshold)),
      match_count: Math.max(1, Math.min(100, Number(limit))),
      filter_nucleus_id: null,
      filter_session_id: sessionId || null,
    });
    if (error || !Array.isArray(data)) return [];
    return data.slice(0, 100);
  } catch {
    return [];
  }
}

export async function rememberSoulMemory({ content, apiKey, agentId, sessionId, memoryType = 'episodic', metadata = {}, importance = 0.5, confidence = 0.5 } = {}) {
  try {
    const input = typeof content === 'string' ? content.trim() : '';
    const key = typeof apiKey === 'string' && apiKey.trim() ? apiKey.trim() : env('GEMINI_API_KEY');
    const supabase = client();
    if (!input || !key || !supabase) return false;
    const vector = await embed(input, key);
    if (!vector) return false;
    const { error } = await supabase.from('soul_memories').insert({
      nucleus_id: 'N01',
      agent_id: agentId || null,
      session_id: sessionId || null,
      content: input,
      embedding: vector,
      memory_type: memoryType,
      metadata,
      importance: clamp(Number(importance)),
      confidence: clamp(Number(confidence)),
    });
    return !error;
  } catch {
    return false;
  }
}
