import assert from 'node:assert/strict';
import { frameCanonicalEnvelope, resolveCanonicalTransport } from '../src/core/soul/CanonicalTransportAdapter.ts';
import { MeshRouter } from '../src/core/soul/MeshRouter.ts';
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

const secret = 'n01-canonical-secret-2026';
const router = new MeshRouter(secret);
const task = await router.createTask('N01', 'N02', { operation: 'probe' });
assert.equal(task.version, '1.0');
assert.equal(task.contractVersion, '1.1.0');
assert.equal(task.source, 'N01');
assert.equal(task.target, 'N02');
assert.equal(task.type, 'TASK');
assert.match(task.hmac, /^[0-9a-f]{64}$/i);
assert.equal(await router.verify(task), true);
await assert.rejects(() => router.createTask('N01', 'N01', {}), /SOUL_MESH_SELF_ROUTE_NOT_ALLOWED/);

console.log('SOUL canonical transport contract: PASS');
