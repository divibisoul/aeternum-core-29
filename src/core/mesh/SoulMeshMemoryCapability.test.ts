import test from 'node:test';
import assert from 'node:assert/strict';
import { SOUL_MESH_CORE_CAPABILITIES } from './SoulMeshCapabilities';
import { createSupabaseVectorMemory } from '../../soul-fusion/SupabaseVectorMemory';

test('N01 exposes Gemini semantic memory capabilities through the native Mesh catalog', () => {
  const ids = SOUL_MESH_CORE_CAPABILITIES.N01.map(capability => capability.id);

  assert.ok(ids.includes('memory.gemini.embedding'));
  assert.ok(ids.includes('memory.semantic.vector.recall'));
  assert.ok(ids.includes('memory.semantic.vector.remember'));
});

test('N01 memory primitive fails closed when Gemini/Supabase credentials are unavailable', async () => {
  const memory = createSupabaseVectorMemory({
    apiKey: '',
    supabaseUrl: '',
    supabaseKey: '',
  });

  assert.equal(await memory.embedText('credential boundary check'), null);
  assert.deepEqual(await memory.recall('credential boundary check'), []);
  assert.equal(await memory.remember('credential boundary check'), false);
});
