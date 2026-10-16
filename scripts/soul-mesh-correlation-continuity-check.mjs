import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createViteServer } from 'vite';

const mode = process.argv[2] ?? '--all';
if (!['--router', '--bridge', '--all'].includes(mode)) {
  throw new Error(`Unsupported correlation-check mode: ${mode}`);
}

const received = [];
let link;
const httpServer = createHttpServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const message = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    received.push(message);
    await new Promise(resolve => setTimeout(resolve, 80));
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({
      protocol: message.protocol,
      contractVersion: message.contractVersion,
      id: `response-${received.length}`,
      correlationId: message.correlationId,
      source: 'N02',
      target: 'N01',
      kind: 'response',
      capability: message.capability,
      payload: { accepted: true, echoedCorrelationId: message.correlationId },
      timestamp: Date.now(),
    }));
  } catch (error) {
    res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  }
});

await new Promise((resolve, reject) => {
  httpServer.once('error', reject);
  httpServer.listen(0, '127.0.0.1', resolve);
});
const address = httpServer.address();
if (!address || typeof address === 'string') throw new Error('LOCAL_MESH_HTTP_ADDRESS_UNAVAILABLE');
const endpoint = `http://127.0.0.1:${address.port}/mesh`;
const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });

try {
  const [transportModule, hybridModule, bridgeModule] = await Promise.all([
    vite.ssrLoadModule('/src/core/mesh/SoulMeshHttpTransport.ts'),
    vite.ssrLoadModule('/src/core/mesh/N01N02HybridLink.ts'),
    vite.ssrLoadModule('/lib/aeternum/RecoveredAeternumExternalCapabilityBridge.ts'),
  ]);
  const { SoulMeshHttpTransport } = transportModule;
  const { N01N02HybridLink } = hybridModule;
  const { delegateN01ExternalCapability } = bridgeModule;
  const transport = new SoulMeshHttpTransport(endpoint, { timeoutMs: 1500, retries: 0 });
  link = new N01N02HybridLink({ transport, timeoutMs: 1500 });

  if (mode === '--router' || mode === '--all') {
    const correlationId = 'corr-n01-explicit-001';
    const first = link.requestN02('strategic_planning', { input: 'first-request' }, correlationId);
    await assert.rejects(
      link.requestN02('strategic_planning', { input: 'concurrent-duplicate' }, correlationId),
      /correlationId already in flight/,
    );
    const response = await first;
    assert.equal(response.correlationId, correlationId, 'router returns the caller correlation unchanged');
    assert.equal(received.length, 1, 'a duplicate in-flight correlation never emits a second request');
    assert.equal(received[0].correlationId, correlationId, 'HTTP envelope keeps the explicit caller correlation');
  }

  if (mode === '--bridge' || mode === '--all') {
    const receivedBefore = received.length;
    await assert.rejects(
      delegateN01ExternalCapability(link, { capability: 'strategic_planning', correlationId: ' ' }),
      /N01_EXTERNAL_CORRELATION_REQUIRED/,
    );
    assert.equal(received.length, receivedBefore, 'blank correlation is rejected before transport');

    const correlationId = 'corr-n01-bridge-001';
    const result = await delegateN01ExternalCapability(link, {
      capability: 'strategic_planning',
      correlationId,
      workloads: [{ id: 'work-1', cost: 1 }],
      candidate: { capability: 'strategic_planning', utility: 0.8 },
    });
    assert.deepEqual(result, { accepted: true, echoedCorrelationId: correlationId });
    assert.equal(received.length, receivedBefore + 1);
    assert.equal(received.at(-1).correlationId, correlationId, 'bridge preserves correlation on the real HTTP envelope');
    assert.equal(received.at(-1).target, 'N02');
    assert.equal(received.at(-1).source, 'N01');

    // Backward-compatibility contract: callers that do not yet supply a
    // correlation still receive a generated UUID from the router.
    const generatedResult = await delegateN01ExternalCapability(link, {
      capability: 'strategic_planning',
      workloads: [],
      candidate: { capability: 'strategic_planning', utility: 0.7 },
    });
    const generatedCorrelationId = received.at(-1)?.correlationId;
    assert.match(
      generatedCorrelationId ?? '',
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      'legacy callers receive a generated UUID instead of losing correlation',
    );
    assert.deepEqual(generatedResult, { accepted: true, echoedCorrelationId: generatedCorrelationId });
    assert.equal(received.at(-1).target, 'N02');
    assert.equal(received.at(-1).source, 'N01');
  }

  console.log(`SOUL_MESH_CORRELATION_${mode.slice(2).toUpperCase()}_PASS`);
} finally {
  link?.close();
  await new Promise(resolve => {
    if (typeof httpServer.closeAllConnections === 'function') httpServer.closeAllConnections();
    httpServer.close(() => resolve());
  });
  await vite.close();
}
