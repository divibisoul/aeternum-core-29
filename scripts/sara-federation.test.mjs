import http from 'node:http';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { requestSara, saraConfigured, saraDescribe } from './sara-federation.mjs';

const original = {
  serviceUrl: process.env.SARA_SERVICE_URL,
  serviceToken: process.env.SARA_SERVICE_TOKEN,
};

function restoreEnv() {
  if (original.serviceUrl === undefined) delete process.env.SARA_SERVICE_URL;
  else process.env.SARA_SERVICE_URL = original.serviceUrl;
  if (original.serviceToken === undefined) delete process.env.SARA_SERVICE_TOKEN;
  else process.env.SARA_SERVICE_TOKEN = original.serviceToken;
}

const server = http.createServer((req, res) => {
  const correlation = String(req.headers['x-correlation-id'] || '');
  res.setHeader('content-type', 'application/json');
  if (req.url === '/health') {
    res.statusCode = 200;
    res.end(JSON.stringify({ service: 'SARA', ready: true }));
    return;
  }
  if (req.headers.authorization !== 'Bearer test-token') {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'UNAUTHORIZED' }));
    return;
  }
  if (req.url === '/v1/capabilities') {
    res.setHeader('x-correlation-id', correlation);
    res.statusCode = 200;
    res.end(JSON.stringify({ service: 'SARA', correlation_id: correlation, operations: ['sara.cycle@1.0.0'] }));
    return;
  }
  if (req.url === '/v1/cycle' && req.method === 'POST') {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      const body = JSON.parse(raw);
      res.setHeader('x-correlation-id', correlation);
      res.statusCode = 200;
      res.end(JSON.stringify({
        cycle_id: body.cycle_id,
        final_state: 'validated',
        correlation_id: correlation,
      }));
    });
    return;
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'NOT_FOUND' }));
});

try {
  delete process.env.SARA_SERVICE_URL;
  delete process.env.SARA_SERVICE_TOKEN;
  assert.equal(saraConfigured(), false);
  assert.equal(saraDescribe().configured, false);

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  process.env.SARA_SERVICE_URL = `http://127.0.0.1:${port}`;
  process.env.SARA_SERVICE_TOKEN = 'test-token';

  assert.equal(saraConfigured(), true);
  const correlationId = 'n01-sara-test-001';
  const discovery = await requestSara('sara.capabilities', {}, correlationId);
  assert.equal(discovery.provider, 'SARA');
  assert.equal(discovery.correlationId, correlationId);
  assert.deepEqual(discovery.payload.operations, ['sara.cycle@1.0.0']);

  const cycle = await requestSara('sara.cycle', { input: 'preservar capacidade', cycle_id: correlationId }, correlationId);
  assert.equal(cycle.provider, 'SARA');
  assert.equal(cycle.correlationId, correlationId);
  assert.equal(cycle.payload.cycle_id, correlationId);
  assert.equal(cycle.payload.final_state, 'validated');

  console.log('N01 SARA federation adapter checks: PASS');
} finally {
  server.close();
  await once(server, 'close').catch(() => undefined);
  restoreEnv();
}
