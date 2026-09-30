import assert from 'node:assert/strict';

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
console.log('N01_CORE_CONTINUITY_PASS');
