import test from 'node:test';
import assert from 'node:assert/strict';
import { SOUL_MESH_CORE_CAPABILITIES } from './SoulMeshCapabilities';
import { createSupabaseVectorMemory } from '../../soul-fusion/SupabaseVectorMemory';

test('N01 exposes semantic memory capabilities through canonical Mesh catalog', () => {
  const ids = SOUL_MESH_CORE_CAPABILITIES.N01.map(c => c.id);
  assert.ok(ids.includes('memory.gemini.embedding'));
  assert.ok(ids.includes('memory.semantic.vector.recall'));
  assert.ok(ids.includes('memory.semantic.vector.remember'));
});

test('N01 semantic memory fails closed without external credentials', async () => {
  const memory = createSupabaseVectorMemory({ apiKey: '', supabaseUrl: '', supabaseKey: '' });
  assert.equal(await memory.embedText('credential boundary'), null);
  assert.deepEqual(await memory.recall('credential boundary'), []);
  assert.equal(await memory.remember('credential boundary'), false);
});
