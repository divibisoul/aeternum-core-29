import assert from 'node:assert/strict';
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

  console.log('CORE_SPEC_OK');
}

await run();
