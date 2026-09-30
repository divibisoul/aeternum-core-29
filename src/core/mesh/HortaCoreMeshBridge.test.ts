import { strict as assert } from 'node:assert';
import { HortaCore } from '../src/core/hortaCore';
import { HortaCoreMeshBridge } from '../src/core/mesh/HortaCoreMeshBridge';
import { SOUL_MESH_PROTOCOL, SOUL_MESH_CONTRACT_VERSION, type SoulMeshMessage } from '../src/core/mesh/SoulMeshProtocol';

function message(partial: Partial<SoulMeshMessage> = {}): SoulMeshMessage {
  return {
    protocol: SOUL_MESH_PROTOCOL,
    contractVersion: SOUL_MESH_CONTRACT_VERSION,
    id: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
    source: 'N02',
    target: 'N01',
    kind: 'event',
    capability: 'mesh.test',
    payload: { ok: true },
    timestamp: Date.now(),
    ...partial,
  };
}

test('HortaCore vascular layer models pressure, flow and backpressure', () => {
  const horta = new HortaCore();
  const vessel = horta.ensureVessel('N01', 'N02', { capacityBytes: 10, resistance: 2 });
  assert.equal(vessel.lastPressure, 1);
  const pulse = horta.beginVascularPulse({ source: 'N01', target: 'N02', bytes: 4, correlationId: 'c1' });
  assert.equal(horta.getVessel(vessel.id)?.inFlightBytes, 4);
  assert.equal(horta.getVessel(vessel.id)?.lastPressure, 0.6);
  assert.equal(horta.getVessel(vessel.id)?.lastPerfusionIndex, 0.3);
  horta.completeVascularPulse(pulse.id, 'completed');
  assert.equal(horta.getVessel(vessel.id)?.inFlightBytes, 0);
  assert.equal(horta.vascularHealth().completedPulses, 1);

  const first = horta.beginVascularPulse({ source: 'N01', target: 'N02', bytes: 10 });
  assert.throws(() => horta.beginVascularPulse({ source: 'N01', target: 'N02', bytes: 1 }), /HORTA_VESSEL_BACKPRESSURE/);
  horta.completeVascularPulse(first.id, 'failed', 'test');
  assert.equal(horta.vascularHealth().rejectedPulses, 1);
});

test('HortaCoreMeshBridge instruments real Soul Mesh message lifecycle', () => {
  const horta = new HortaCore();
  const bridge = new HortaCoreMeshBridge(horta);

  const outbound = message({ source: 'N01', target: 'N02', kind: 'request', capability: 'mesh.health' });
  const outboundReceipt = bridge.beforeSend(outbound) as { id?: string };
  assert.equal(typeof outboundReceipt?.id, 'string');
  bridge.afterSend(outbound, outboundReceipt);
  assert.equal(horta.vascularHealth().completedPulses, 1);
  assert.equal(horta.getVessel('artery:N01->N02:outbound')?.completedPulses, 1);

  const inbound = message({ source: 'N02', target: 'N01', kind: 'response', capability: 'mesh.health' });
  bridge.onReceive(inbound);
  assert.equal(horta.vascularHealth().completedPulses, 2);
  assert.equal(horta.getVessel('artery:N02->N01:inbound')?.completedPulses, 1);
});
