import assert from 'node:assert/strict';
import test from 'node:test';
import { SoulMeshOrchestrator } from './SoulMeshOrchestrator.ts';

test('plans only executable capabilities reachable over compatible transports', () => {
  const orchestrator = new SoulMeshOrchestrator();
  const plan = orchestrator.plan(
    ['HTTP', 'REALTIME'],
    [
      { nucleus: 'N02', capability: 'ai.generate', availability: 'executable', transports: ['HTTP'] },
      { nucleus: 'N03', capability: 'audio.transcribe', availability: 'declared', transports: ['HTTP'] },
      { nucleus: 'N04', capability: 'document.create', availability: 'executable', transports: ['REALTIME'] },
    ],
    [
      { id: 'generate', capability: 'ai.generate', target: 'N02' },
      { id: 'create', capability: 'document.create', target: 'N04', dependsOn: ['generate'] },
    ],
  );
  assert.deepEqual(plan.steps, [
    { id: 'generate', capability: 'ai.generate', target: 'N02' },
    { id: 'create', capability: 'document.create', target: 'N04', dependsOn: ['generate'] },
  ]);
});

test('rejects declared-only capabilities and unavailable peers', () => {
  const orchestrator = new SoulMeshOrchestrator();
  assert.throws(() => orchestrator.plan(
    ['HTTP'],
    [{ nucleus: 'N03', capability: 'audio.transcribe', availability: 'declared', transports: ['HTTP'] }],
    [{ capability: 'audio.transcribe' }],
  ), /CAPABILITY_ROUTE_UNAVAILABLE/);
});
