import assert from 'node:assert/strict';
import { buildCapabilityLinks, canCompose } from './SoulMeshCapabilityGraph.ts';

const links = buildCapabilityLinks(['HTTP', 'REALTIME'], [
  { nucleus: 'N02', capability: 'ai.generate', availability: 'executable', transports: ['HTTP'] },
  { nucleus: 'N03', capability: 'audio.transcribe', availability: 'declared', transports: ['HTTP'] },
  { nucleus: 'N04', capability: 'document.create', availability: 'executable', transports: ['REALTIME'] },
]);

assert.deepEqual(links, [
  { source: 'N01', target: 'N02', capability: 'ai.generate', transport: 'HTTP', executable: true },
  { source: 'N01', target: 'N04', capability: 'document.create', transport: 'REALTIME', executable: true },
]);

const declaredOnly = buildCapabilityLinks(['HTTP'], [
  { nucleus: 'N03', capability: 'audio.transcribe', availability: 'declared', transports: ['HTTP'] },
  { nucleus: 'N02', capability: 'ai.generate', availability: 'executable', transports: ['HTTP'] },
]);
assert.equal(canCompose(declaredOnly, 'audio.transcribe', 'ai.generate'), false);

console.log('SoulMeshCapabilityGraph: OK');
