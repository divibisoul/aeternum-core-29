import assert from 'node:assert/strict';
import test from 'node:test';

import { createFusionEnvelope } from './FusionEnvelope';
import { N01AgentProcessor } from './N01AgentProcessor';
import { ProcessorHealthRegistry } from './ProcessorHealthRegistry';
import { ProcessorRuntime } from './ProcessorRuntime';
import { N01AgentRegistry } from '../mesh/N01AgentRegistry';

test('N01 native mesh agent executes through additive fusion runtime', async () => {
  const agents = new N01AgentRegistry();
  agents.register({
    id: 'N01-test-agent',
    name: 'N01 Test Agent',
    capabilities: ['mesh.health'],
    execute: async (message) => ({ capability: message.capability, ok: true }),
  });

  const health = new ProcessorHealthRegistry({ now: () => 1000 });
  const processor = new N01AgentProcessor(agents, 'N01-test-agent');
  const runtime = new ProcessorRuntime(processor, {
    healthRegistry: health,
    now: () => 1000,
    setInterval: () => undefined,
    clearInterval: () => undefined,
  });

  await runtime.start();
  const envelope = createFusionEnvelope({
    source: 'N01',
    target: 'N01',
    capability: 'mesh.health',
    payload: { probe: true },
    correlationId: 'corr-n01-test',
    traceId: 'trace-n01-test',
    now: 1000,
  });

  const output = await runtime.execute(envelope);
  assert.deepEqual(output, { capability: 'mesh.health', ok: true });

  const metrics = runtime.metrics();
  assert.equal(metrics.invocations, 1);
  assert.equal(metrics.successes, 1);
  assert.equal(metrics.failures, 0);
  assert.equal(health.get('N01-test-agent')?.effectiveState, 'ACTIVE');

  await runtime.stop();
});
