import assert from 'node:assert/strict';
import { N01AgentRegistry } from '../src/core/mesh/N01AgentRegistry';
import { createSoulMeshMessage } from '../src/core/mesh/SoulMeshProtocol';
import { createN01PrefrontalOptimizerAgent, N01_PREFRONTAL_OPTIMIZE_CAPABILITY } from '../src/soul-fusion/N01PrefrontalAgent';
import {
  nervoVago,
  hortaCore,
  wormhole,
  NeuralCoordinates,
  genesisModule,
} from '../src/core';

export async function run(): Promise<void> {
  let received: unknown;
  const unsubscribeRoundtrip = nervoVago.on('core.test.roundtrip', data => {
    received = data;
  });
  nervoVago.emit('core.test.roundtrip', { ok: true, source: 'core.spec' });
  assert.deepEqual(received, { ok: true, source: 'core.spec' });
  unsubscribeRoundtrip();

  let observed: unknown;
  const unsubscribeObserver = hortaCore.observe('core.test.observer', value => {
    observed = value;
  });
  hortaCore.set('core.test.observer', 42);
  assert.equal(observed, 42);
  assert.equal(hortaCore.get<number>('core.test.observer'), 42);
  unsubscribeObserver();

  const testModuleId = 'core.spec.module';
  wormhole.register(testModuleId, { test: true }, {
    type: 'core',
    version: '1.0.0',
    capabilities: ['unit-test'],
    dependencies: [],
  });
  assert.equal(wormhole.has(testModuleId), true);
  assert.equal(wormhole.list().includes(testModuleId), true);
  assert.equal(wormhole.findByType('core').includes(testModuleId), true);
  assert.equal(wormhole.findByCapability('unit-test').includes(testModuleId), true);
  assert.equal(wormhole.getSignature(testModuleId)?.version, '1.0.0');

  assert.deepEqual(
    NeuralCoordinates.generate('core.spec'),
    NeuralCoordinates.generate('core.spec'),
  );

  let genesisResponse: any;
  const unsubscribeGenesis = nervoVago.on('genesis.response', data => {
    genesisResponse = data;
  });
  nervoVago.emit('genesis.query');
  assert.equal(genesisResponse?.projectName, 'AETERNUM');
  assert.equal(genesisResponse?.version, '3.1.0');
  assert.equal(genesisResponse?.hash, genesisModule && hortaCore.get('genesis.record')?.hash);
  unsubscribeGenesis();

  const prefrontalRegistry = new N01AgentRegistry();
  prefrontalRegistry.register(createN01PrefrontalOptimizerAgent());
  const pfcRequest = createSoulMeshMessage({
    source: 'N02',
    target: 'N01',
    kind: 'request',
    capability: N01_PREFRONTAL_OPTIMIZE_CAPABILITY,
    payload: {
      goalId: 'core.spec.prefrontal',
      description: 'Improve the fragile Mesh trace/correlation boundary',
      weakPoint: 'mesh trace correlation retry',
      priority: 0.9,
      context: { source: 'core.spec', nonDestructive: true },
    },
    correlationId: 'corr-core-spec-prefrontal',
    meta: { traceId: 'trace-core-spec-prefrontal' },
  });
  const pfcResponse = await prefrontalRegistry.execute(pfcRequest) as {
    status: string;
    agentId: string;
    correlationId: string;
    traceId: string;
    decision: { inhibited: boolean; selectedNucleus?: string };
    optimization: { actions?: Array<{ id: string }> };
    execution: { backend: string; nucleus: string; latencyMs: number };
  };
  assert.equal(pfcResponse.status, 'completed');
  assert.equal(pfcResponse.agentId, 'N01.neocortex-prefrontal-optimizer');
  assert.equal(pfcResponse.correlationId, 'corr-core-spec-prefrontal');
  assert.equal(pfcResponse.traceId, 'trace-core-spec-prefrontal');
  assert.equal(pfcResponse.decision.inhibited, false);
  assert.equal(pfcResponse.decision.selectedNucleus, 'N01');
  assert.equal(pfcResponse.execution.backend, 'IN_PROCESS');
  assert.equal(pfcResponse.execution.nucleus, 'N01');
  assert.ok(Number.isFinite(pfcResponse.execution.latencyMs));
  assert.ok((pfcResponse.optimization.actions?.length ?? 0) >= 3);
  assert.ok(pfcResponse.optimization.actions?.some(action => action.id === 'preserve-correlation'));

  console.log('CORE_SPEC_OK');
}

await run();
