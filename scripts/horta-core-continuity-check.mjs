import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { HortaCore } = await server.ssrLoadModule('/src/core/hortaCore.ts');
  const { EventBus } = await server.ssrLoadModule('/src/core/EventBus.ts');
  const { ProcessorHealthRegistry } = await server.ssrLoadModule('/src/core/fusion/ProcessorHealthRegistry.ts');
  const { HortaCoreContinuityBridge } = await server.ssrLoadModule('/src/core/HortaCoreContinuityBridge.ts');

  const state = new HortaCore();
  const registry = new ProcessorHealthRegistry({ now: () => 1000 });
  const bridge = new HortaCoreContinuityBridge(state);

  bridge.connectEventBus(['system:ready', 'soul:mesh:message']);
  bridge.connectHealthRegistry(registry);

  const first = state.set('test.value', 1);
  const second = state.set('test.value', 2);
  assert.equal(first.sequence, 1);
  assert.equal(second.sequence, 2);
  assert.equal(state.get<number>('test.value'), 2);
  assert.equal(state.getChangeLog().length, 2);

  await EventBus.emit('system:ready', { modules: ['n01'] });
  assert.equal(
    state.get<{ data: { modules: string[] } }>('continuity.event.system:ready.last')?.data.modules.length,
    1,
  );

  await EventBus.emit('soul:mesh:message', {
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: 'msg-1',
    correlationId: 'corr-1',
    source: 'N02',
    target: 'N01',
    kind: 'request',
    capability: 'mesh.health',
    timestamp: 1000,
  });
  assert.equal(
    state.get<{ data: { capability: string } }>('continuity.event.soul:mesh:message.last')?.data.capability,
    'mesh.health',
  );

  registry.publish({
    processorId: 'N01-mesh-agent',
    state: 'ACTIVE',
    commissioning: 'OPERATIONAL',
    at: 1000,
    queueDepth: 0,
    inFlight: 0,
    meanLatencyMs: 4,
    errorRate: 0,
    restarts: 0,
  });

  const health = state.get<{ effectiveState: string }>('continuity.fusion.processor.N01-mesh-agent');
  assert.equal(health?.effectiveState, 'ACTIVE');
  assert.equal(state.get<{ total: number }>('continuity.fusion.aggregate')?.total, 1);

  bridge.dispose();
  const before = state.getChangeLog().length;
  await EventBus.emit('system:ready', { modules: ['n01', 'n02'] });
  assert.equal(state.getChangeLog().length, before);

  console.log(JSON.stringify({
    status: 'PASS',
    hortaSequence: second.sequence,
    processorState: health?.effectiveState,
    aggregateProcessors: state.get<{ total: number }>('continuity.fusion.aggregate')?.total,
  }, null, 2));
} finally {
  await server.close();
}
