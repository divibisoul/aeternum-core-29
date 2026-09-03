import assert from 'node:assert/strict';
import { frameCanonicalEnvelope, resolveCanonicalTransport } from '../src/core/soul/CanonicalTransportAdapter.ts';
import { N01_TRANSPORT_REGISTRY, supportsBidirectional } from '../lib/soul-mesh/HybridTransportRegistry.ts';

const all = ['IN_PROCESS', 'WEBVIEW_BRIDGE', 'LOOPBACK_HTTP', 'HTTP', 'REALTIME'];
assert.equal(N01_TRANSPORT_REGISTRY.length, 5);
assert.deepEqual(N01_TRANSPORT_REGISTRY.map(({ kind }) => kind), all);
for (const transport of all) assert.equal(supportsBidirectional(transport), true, `${transport} must remain bidirectional`);
assert.equal(resolveCanonicalTransport(['HTTP', 'REALTIME'], ['REALTIME', 'HTTP']), 'HTTP');
assert.equal(resolveCanonicalTransport(['REALTIME'], ['HTTP', 'REALTIME']), 'REALTIME');
assert.throws(() => resolveCanonicalTransport(['HTTP'], ['IN_PROCESS']), /NO_COMPATIBLE_BIDIRECTIONAL_TRANSPORT/);
const envelope = { version: '1.0', nucleusId: 'N01' };
assert.deepEqual(frameCanonicalEnvelope(envelope, 'HTTP'), { envelope, transport: 'HTTP' });
assert.throws(() => frameCanonicalEnvelope(envelope, 'INVALID'), /UNSUPPORTED_TRANSPORT/);
console.log('SOUL canonical transport contract: PASS');
