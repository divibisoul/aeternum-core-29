import { recallSoulMemories, rememberSoulMemory } from './supabase-vector-memory.mjs';

const original = {
  url: process.env.SUPABASE_URL,
  secret: process.env.SUPABASE_SECRET_KEY,
  service: process.env.SUPABASE_SERVICE_ROLE_KEY,
  anon: process.env.SUPABASE_ANON_KEY,
};

for (const name of ['SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY']) delete process.env[name];

try {
  const memories = await recallSoulMemories({ text: 'graceful degradation check' });
  const stored = await rememberSoulMemory({ content: 'graceful degradation check' });

  if (!Array.isArray(memories) || memories.length !== 0) throw new Error('GRACEFUL_RECALL_CONTRACT_FAILED');
  if (stored !== false) throw new Error('GRACEFUL_REMEMBER_CONTRACT_FAILED');

  console.log('SUPABASE_VECTOR_MEMORY_GRACEFUL_DEGRADATION_OK');
} finally {
  if (original.url !== undefined) process.env.SUPABASE_URL = original.url;
  if (original.secret !== undefined) process.env.SUPABASE_SECRET_KEY = original.secret;
  if (original.service !== undefined) process.env.SUPABASE_SERVICE_ROLE_KEY = original.service;
  if (original.anon !== undefined) process.env.SUPABASE_ANON_KEY = original.anon;
}
