import { strict as assert } from 'node:assert';
import { HortaCore } from '../src/core/hortaCore';
import { HortaCoreMeshBridge } from '../src/core/mesh/HortaCoreMeshBridge';
import { SoulMeshRouter } from '../src/core/mesh/SoulMeshRouter';
import { SOUL_MESH_PROTOCOL, SOUL_MESH_CONTRACT_VERSION, type SoulMeshMessage, type SoulMeshTransport } from '../src/core/mesh/SoulMeshProtocol';

class FakeTransport implements SoulMeshTransport {
  sent: SoulMeshMessage[] = [];
  private listener?: (message: SoulMeshMessage) => void | Promise<void>;

  send(message: SoulMeshMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    this.listener = handler;
    return () => { this.listener = undefined; };
  }

  async receive(message: SoulMeshMessage): Promise<void> {
    await this.listener?.(message);
  }
}

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

test('Soul Mesh traffic actually communicates with HortaCore through router instrumentation', async () => {
  const transport = new FakeTransport();
  const horta = new HortaCore();
  const router = new SoulMeshRouter(transport, 'N01');
  router.setTrafficObserver(new HortaCoreMeshBridge(horta));

  await router.sendEvent('N02', 'mesh.test', { payload: true });
  assert.equal(horta.vascularHealth().completedPulses, 1);
  assert.equal(transport.sent.length, 1);

  await transport.receive(message());
  assert.equal(horta.vascularHealth().completedPulses, 2);
  assert.equal(horta.vascularHealth().vesselCount, 2);
  router.close();
});
