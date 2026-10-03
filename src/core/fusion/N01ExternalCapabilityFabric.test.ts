import { strict as assert } from 'node:assert';
import test from 'node:test';
import { describeN01ExternalCapabilityFabric, findN01ExternalProvidersByCapability, resolveN01ExternalProvider } from './N01ExternalCapabilityFabric';

test('N01 fabric contains the canonical 25 upstream sources', () => {
  const fabric = describeN01ExternalCapabilityFabric();
  assert.equal(fabric.providerCount, 25);
  assert.equal(resolveN01ExternalProvider('langgraph').revision, '157a06dda988d85afeb8751ff27b35ab3f4f8bf4');
  assert.equal(resolveN01ExternalProvider('letta-code').owner, 'N01');
  assert.equal(resolveN01ExternalProvider('mem0').owner, 'N06');
  assert.equal(resolveN01ExternalProvider('browser-use').owner, 'N04');
  assert.equal(resolveN01ExternalProvider('whisper').owner, 'N03');
  assert.equal(resolveN01ExternalProvider('llama-index').owner, 'N05');
});

test('N01 fabric resolves by capability without claiming execution', () => {
  const rows = findN01ExternalProvidersByCapability('speech');
  assert.deepEqual(rows.map(row => row.id), ['whisper', 'kokoro']);
});

test('unknown provider fails closed', () => {
  assert.throws(() => resolveN01ExternalProvider('does-not-exist'), /N01_EXTERNAL_PROVIDER_UNKNOWN/);
});