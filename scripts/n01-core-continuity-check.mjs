import assert from 'node:assert/strict';
import { ProcessingNode } from '../src/core/neural/ProcessingNode.ts';
import { HomeostasisManager } from '../src/core/neural/HomeostasisManager.ts';
import { VagusNerve } from '../src/core/neural/VagusNerve.ts';

const [{ EventBus }, { nervoVago }, { aeternumBus }, { ProjetoClareira }, { ModuleRegistry }] =
  await Promise.all([
    import('../src/core/EventBus.ts'),
    import('../src/core/eventBus.ts'),
    import('../lib/aeternum/EventBus.ts'),
    import('../src/core/neural/ProjetoClareira.ts'),
    import('../src/core/ModuleRegistry.ts'),
  ]);

let aeternumBridgeSeen = 0;
const unsubscribeCanonical = EventBus.on('aeternum:bridge', (payload) => {
  if (payload?.event === 'continuity.probe') aeternumBridgeSeen += 1;
});
await aeternumBus.emit('continuity.probe', { source: 'aeternum-facade' });
assert.equal(aeternumBridgeSeen, 1);

let nervoSeen = 0;
const unsubscribeNervo = nervoVago.on('continuity.probe', () => {
  nervoSeen += 1;
});
nervoVago.emit('continuity.probe', { source: 'nervo-vago' });
await new Promise((resolve) => setTimeout(resolve, 0));
assert.equal(nervoSeen, 1);

const status = ProjetoClareira.getStatus();
assert.equal(status.nodes.length, 9);
for (const id of ['NC-001', 'NP-001', 'NP-002', 'NP-003', 'NS-001', 'NS-002', 'NS-003', 'NS-004', 'NS-005']) {
  assert.ok(status.nodes.some((node) => node.id === id), id);
}

assert.equal(typeof EventBus.emit, 'function');
assert.equal(typeof EventBus.on, 'function');
assert.equal(typeof EventBus.listenerCount, 'function');
assert.equal(typeof ModuleRegistry.register, 'function');
assert.equal(typeof ModuleRegistry.initialize, 'function');

unsubscribeNervo();
unsubscribeCanonical();

// Exercise the real afferent/efferent path without mocks: node -> VagusNerve
// -> HomeostasisManager -> command -> same node.
const communicationNode = new ProcessingNode('N01-CONTINUITY-VAGUS', 'Primary');
const communicationHomeostasis = new HomeostasisManager();
const communicationVagus = new VagusNerve(communicationHomeostasis);
communicationHomeostasis.attachVagus(communicationVagus);
communicationHomeostasis.registerNodes([communicationNode]);
communicationVagus.registerNode(communicationNode);
const initialProcessingRate = communicationNode.processingRateMultiplier;
communicationVagus.start();
try {
  communicationNode.reportVagalAfferent(
    'energy_low',
    { source: 'continuity-check', energyRatio: communicationNode.getState().loadRatio },
    0.85,
  );
  await new Promise((resolve) => setTimeout(resolve, 250));
  const vagusSnapshot = communicationVagus.snapshot();
  assert.equal(vagusSnapshot.signalsIn, 1, 'node afferent reaches VagusNerve');
  assert.equal(vagusSnapshot.signalsOut, 1, 'HomeostasisManager command returns through VagusNerve');
  assert.ok(
    communicationNode.processingRateMultiplier < initialProcessingRate,
    'efferent calm command changes the original node rate',
  );
} finally {
  communicationVagus.stop();
}
console.log('N01_CORE_CONTINUITY_PASS');
