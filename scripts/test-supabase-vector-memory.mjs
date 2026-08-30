import { recallSoulMemories, rememberSoulMemory } from './supabase-vector-memory.mjs';

const original = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
};

try {
  delete process.env.GEMINI_API_KEY;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_ANON_KEY;

  const recalled = await recallSoulMemories({ text: 'graceful degradation check' });
  if (!Array.isArray(recalled) || recalled.length !== 0) throw new Error('RAG_RECALL_DEGRADATION_FAILED');

  const remembered = await rememberSoulMemory({ content: 'graceful degradation check' });
  if (remembered !== false) throw new Error('RAG_MEMORY_DEGRADATION_FAILED');

  console.log('SUPABASE_VECTOR_MEMORY_GRACEFUL_DEGRADATION_OK');
} finally {
  for (const [key, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
