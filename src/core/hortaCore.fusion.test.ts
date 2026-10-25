import { strict as assert } from 'node:assert';
import test from 'node:test';
import { HortaCore } from './hortaCore';
import { AeternumHortaCore } from '../../lib/aeternum/HortaCore';

test('single HortaCore preserves legacy and vascular state in one authority', () => {
  const canonical = new HortaCore();
  const legacyFacade = new AeternumHortaCore(2000, canonical);

  legacyFacade.set('organ.state', { healthy: true });
  assert.deepEqual(canonical.get('organ.state'), { healthy: true });

  const vessel = canonical.ensureVessel('N01', 'N02', { capacityBytes: 32, resistance: 2 });
  legacyFacade.set(`vascular.vessel.${vessel.id}.marker`, 'present');

  assert.equal(legacyFacade.get(`vascular.vessel.${vessel.id}.marker`), 'present');
  assert.equal(canonical.get(`vascular.vessel.${vessel.id}.marker`), 'present');
});

test('one HortaCore can multiply a correlated response through vascular branches', () => {
  const horta = new HortaCore();

  const flow = horta.beginSynergisticPulse({
    source: 'N01',
    targets: ['N02', 'N03', 'N04'],
    bytes: 8,
    correlationId: 'corr-synergy-1',
    capability: 'mesh.cooperation',
    role: 'organ-cooperation',
  });

  assert.equal(flow.status, 'accepted');
  assert.equal(flow.acceptedPulseIds.length, 3);
  assert.equal(horta.listFunctionalLinks().length, 3);

  for (const pulseId of flow.acceptedPulseIds) {
    const pulse = horta.getVascularFlowLog();
    assert.ok(Array.isArray(pulse));
    horta.completeVascularPulse(pulseId, 'completed');
  }

  const completed = horta.getSynergisticFlow(flow.id);
  assert.equal(completed?.status, 'completed');
  assert.equal(horta.vascularHealth().completedPulses, 3);
  assert.equal(horta.listVessels().length, 3);
});

test('synergistic fan-out preserves partial failure instead of hiding it', () => {
  const horta = new HortaCore();
  const flow = horta.beginSynergisticPulse({
    source: 'N01',
    targets: ['N02', 'N03'],
    bytes: 10,
    capacityBytes: 10,
    correlationId: 'corr-partial-1',
  });

  assert.equal(flow.acceptedPulseIds.length, 2);

  const second = horta.beginSynergisticPulse({
    source: 'N01',
    targets: ['N02', 'N03'],
    bytes: 1,
    capacityBytes: 10,
    correlationId: 'corr-partial-2',
  });

  assert.equal(second.status, 'rejected');
  assert.equal(second.rejectedTargets.length, 2);

  horta.completeSynergisticPulse(flow.id, 'completed');
  assert.equal(horta.vascularHealth().completedPulses, 2);
  assert.equal(horta.vascularHealth().rejectedPulses, 2);
});
