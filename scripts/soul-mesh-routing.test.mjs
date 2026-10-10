import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { resolveCapabilityOwner } from './soul-mesh-routing.mjs';

test('N02-owned Lote 3 capabilities resolve to N02 without dynamic registration', () => {
  const peers = new Map([
    ['N02', { id: 'N02', capabilities: [] }],
    ['N03', { id: 'N03', capabilities: [] }],
    ['N06', { id: 'N06', capabilities: [] }],
  ]);

  for (const capability of ['ai.generate', 'ai.multimodal', 'cognitive-processing']) {
    assert.equal(resolveCapabilityOwner(capability, peers), 'N02', capability);
  }
});

test('canonical N02 ownership cannot be overridden by another peer advertisement', () => {
  const peers = new Map([
    ['N03', { id: 'N03', capabilities: ['ai.multimodal'] }],
  ]);

  assert.equal(resolveCapabilityOwner('ai.multimodal', peers), 'N02');
});

test('dynamic peer capability discovery remains available for non-canonical capabilities', () => {
  const peers = new Map([
    ['N05', { id: 'N05', capabilities: ['workflow.custom.v1'] }],
  ]);

  assert.equal(resolveCapabilityOwner('workflow.custom.v1', peers), 'N05');
});

test('historical namespace routing and N01-local ownership remain unchanged', () => {
  const peers = new Map();

  const expected = new Map([
    ['inference.intent', 'N01'],
    ['clareira.ingest', 'N01'],
    ['inference.reason', 'N02'],
    ['conversation.reply', 'N02'],
    ['audio.transcribe', 'N03'],
    ['multimodal.image', 'N03'],
    ['document.extract', 'N04'],
    ['tool:browser.search', 'N04'],
    ['orchestration.plan', 'N05'],
    ['dispatch.job', 'N05'],
    ['cognitive.synthesize', 'N06'],
    ['support.triage', 'N06'],
  ]);

  for (const [capability, owner] of expected) {
    assert.equal(resolveCapabilityOwner(capability, peers), owner, capability);
  }
  assert.equal(resolveCapabilityOwner('unowned.capability', peers), null);
});

test('N01 production gateway imports and uses the tested resolver', async () => {
  const source = await readFile(new URL('./soul-mesh-server.mjs', import.meta.url), 'utf8');
  assert.match(source, /import \{ resolveCapabilityOwner \} from '\.\/soul-mesh-routing\.mjs';/);
  assert.match(source, /function resolveOwner\(capability\)\{ return resolveCapabilityOwner\(capability, peers\); \}/);
});
