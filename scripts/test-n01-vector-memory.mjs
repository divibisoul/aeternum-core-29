import assert from 'node:assert/strict';
import { recallSoulMemories, rememberSoulMemory } from './supabase-vector-memory.mjs';

const original = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
};

delete process.env.GEMINI_API_KEY;
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_ANON_KEY;

try {
  const recalled = await recallSoulMemories({ text: 'graceful degradation check' });
  assert.deepEqual(recalled, []);

  const remembered = await rememberSoulMemory({ content: 'graceful degradation check' });
  assert.equal(remembered, false);

  console.log('N01 vector memory graceful degradation: OK');
} finally {
  for (const [name, value] of Object.entries(original)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
