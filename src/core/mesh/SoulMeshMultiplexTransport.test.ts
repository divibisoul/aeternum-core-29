import assert from 'node:assert/strict';
import { SoulMeshMultiplexTransport } from './SoulMeshMultiplexTransport.ts';
import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol.ts';

class FakeTransport implements SoulMeshTransport {
  sent: SoulMeshMessage[] = [];
  private readonly listeners = new Set<(message: SoulMeshMessage) => void | Promise<void>>();
  constructor(private readonly fail = false) {}
  async send(message: SoulMeshMessage) {
    if (this.fail) throw new Error('transport failed');
    this.sent.push(message);
  }
  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>) {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }
  emit(message: SoulMeshMessage) {
    for (const listener of this.listeners) void listener(message);
  }
}

const first = new FakeTransport(true);
const second = new FakeTransport();
const mesh = new SoulMeshMultiplexTransport([first, second]);
const message = {
  protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: 'm1', correlationId: 'c1',
  source: 'N01', target: 'N02', kind: 'request', capability: 'mesh.ping', payload: {}, timestamp: Date.now(),
} as SoulMeshMessage;
await mesh.send(message);
assert.equal(first.sent.length, 0);
assert.equal(second.sent.length, 1);

let deliveries = 0;
mesh.onMessage(() => { deliveries += 1; });
second.emit(message);
second.emit(message);
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(deliveries, 1);
mesh.close();
console.log('SoulMeshMultiplexTransport: PASS');
