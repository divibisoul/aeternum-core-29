import assert from 'node:assert/strict';

const [{ EventBus }, { nervoVago }, { aeternumBus }, { ProjetoClareira }, { ModuleRegistry }] =
  await Promise.all([
    import('../src/core/EventBus.ts'),
    import('../src/core/eventBus.ts'),
    import('../lib/aeternum/EventBus.ts'),
    import('../src/core/neural/ProjetoClareira.ts'),
    import('../src/core/ModuleRegistry.ts'),
  ]);

let canonicalSeen = 0;
const unsubscribeCanonical = EventBus.on('aeternum:bridge', () => {
  canonicalSeen += 1;
});

await aeternumBus.emit('continuity.probe', { source: 'aeternum-facade' });
assert.equal(canonicalSeen, 1, 'AeternumEventBus must delegate to canonical EventBus');

let nervoSeen = 0;
const unsubscribeNervo = nervoVago.on('continuity.probe', () => {
  nervoSeen += 1;
});
nervoVago.emit('continuity.probe', { source: 'nervo-vago' });
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(nervoSeen, 1, 'nervoVago must delegate subscription/emission to canonical EventBus');

const status = ProjetoClareira.getStatus();
assert.equal(status.nodes.length, 9, 'Clareira must preserve 9 nodes');
assert.ok(status.nodes.some(node => node.nodeId === 'NC-001'), 'NC-001 must exist');
assert.ok(status.nodes.some(node => node.nodeId === 'NP-001'), 'NP-001 must exist');
assert.ok(status.nodes.some(node => node.nodeId === 'NP-002'), 'NP-002 must exist');
assert.ok(status.nodes.some(node => node.nodeId === 'NP-003'), 'NP-003 must exist');
for (let i = 1; i <= 5; i += 1) {
  assert.ok(status.nodes.some(node => node.nodeId === `NS-${i.toString().padStart(3, '0')}`), `NS-${i.toString().padStart(3, '0')} must exist`);
}

assert.equal(typeof ModuleRegistry.register, 'function');
assert.equal(typeof ModuleRegistry.initialize, 'function');
assert.equal(typeof EventBus.emit, 'function');
assert.equal(typeof EventBus.on, 'function');
assert.equal(typeof EventBus.listenerCount, 'function');

unsubscribeNervo();
unsubscribeCanonical();

console.log('N01_CORE_CONTINUITY_PASS');
