import assert from 'node:assert/strict';
import { recallSoulMemories, rememberSoulMemory } from './supabase-vector-memory.mjs';

const envNames = [
  'GEMINI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const original = Object.fromEntries(envNames.map((name) => [name, process.env[name]]));

try {
  for (const name of envNames) delete process.env[name];

  const recalled = await recallSoulMemories({ text: 'graceful degradation check' });
  assert.deepEqual(recalled, []);

  const remembered = await rememberSoulMemory({ content: 'graceful degradation check' });
  assert.equal(remembered, false);

  console.log('SUPABASE_VECTOR_MEMORY_GRACEFUL_DEGRADATION_OK');
} finally {
  for (const name of envNames) {
    const value = original[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
