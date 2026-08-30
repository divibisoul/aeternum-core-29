import assert from 'node:assert/strict';
import {
  frameCanonicalEnvelope,
  resolveCanonicalTransport,
} from '../src/core/soul/CanonicalTransportAdapter.ts';
import { MeshRouter } from '../src/core/soul/MeshRouter.ts';
import { getN01MeshCapabilities, validateN01MeshCapabilities } from '../src/core/soul/N01CapabilityBridge.ts';
import { N01_TRANSPORT_REGISTRY, supportsBidirectional } from '../lib/soul-mesh/HybridTransportRegistry.ts';

const all = ['IN_PROCESS', 'WEBVIEW_BRIDGE', 'LOOPBACK_HTTP', 'HTTP', 'REALTIME'];

assert.equal(N01_TRANSPORT_REGISTRY.length, 5);
assert.deepEqual(
  N01_TRANSPORT_REGISTRY.map(({ kind }) => kind),
  all,
);

for (const transport of all) {
  assert.equal(supportsBidirectional(transport), true, `${transport} must remain bidirectional`);
}

assert.equal(resolveCanonicalTransport(['HTTP', 'REALTIME'], ['REALTIME', 'HTTP']), 'HTTP');
assert.equal(resolveCanonicalTransport(['REALTIME'], ['HTTP', 'REALTIME']), 'REALTIME');
assert.throws(
  () => resolveCanonicalTransport(['HTTP'], ['IN_PROCESS']),
  /NO_COMPATIBLE_BIDIRECTIONAL_TRANSPORT/,
);

const router = new MeshRouter('test-secret');
assert.equal(router.selectTransport(['HTTP', 'REALTIME'], ['REALTIME', 'HTTP']), 'HTTP');

validateN01MeshCapabilities();
const capabilities = getN01MeshCapabilities();
assert.ok(capabilities.length > 0, 'N01 capability bridge must expose capabilities');
assert.equal(new Set(capabilities.map(({ id }) => id)).size, capabilities.length);

const envelope = { version: '1.0', nucleusId: 'N01' };
assert.deepEqual(frameCanonicalEnvelope(envelope, 'HTTP'), {
  envelope,
  transport: 'HTTP',
});
assert.throws(
  () => frameCanonicalEnvelope(envelope, 'INVALID'),
  /UNSUPPORTED_TRANSPORT/,
);

console.log(`SOUL canonical transport + capability contract: PASS (${capabilities.length} capabilities)`);
