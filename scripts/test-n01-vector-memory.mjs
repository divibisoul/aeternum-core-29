import assert from 'node:assert/strict';
import { recallSoulMemories, rememberSoulMemory } from './supabase-vector-memory.mjs';

const names = [
  'GEMINI_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SECRET_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));
names.forEach((name) => delete process.env[name]);

try {
  const recalled = await recallSoulMemories({ text: 'graceful degradation check' });
  assert.deepEqual(recalled, []);

  const remembered = await rememberSoulMemory({ content: 'graceful degradation check' });
  assert.equal(remembered, false);

  console.log('N01 vector memory graceful degradation: OK');
} finally {
  for (const name of names) {
    const value = original[name];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
