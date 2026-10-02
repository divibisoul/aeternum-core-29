import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import net from 'node:net';

const configuredPort = Number(process.env.SOUL_MESH_LOCAL_TEST_PORT || 0);
const reservePort = (port) => new Promise((resolve, reject) => {
  const server = net.createServer();
  server.once('error', reject);
  server.listen(port, '127.0.0.1', () => { const address = server.address(); const selected = typeof address === 'object' && address ? address.port : port; server.close(() => resolve(selected)); });
});
const findPortPair = async () => {
  if (configuredPort > 0) {
    try { await reservePort(configuredPort); await reservePort(configuredPort + 1); return configuredPort; } catch {}
  }
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = await reservePort(0);
    try { await reservePort(candidate + 1); return candidate; } catch {}
  }
  throw new Error('N01_LOCAL_PORT_PAIR_UNAVAILABLE');
};
const port = await findPortPair();
const baseUrl = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['scripts/soul-mesh-server-entry.mjs'], {
  env: { ...process.env, SOUL_MESH_N01_PORT: String(port), SOUL_MESH_N01_HOST: '127.0.0.1' },
  stdio: ['ignore', 'inherit', 'inherit'],
});

const waitForHealth = async () => {
  const deadline = Date.now() + 30_000;
  let lastStatus = 0;
  let lastBody = '';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/soul-mesh/health`, { cache: 'no-store' });
      lastStatus = response.status;
      lastBody = await response.text();
      if (response.ok) return;
    } catch (error) {
      lastBody = error instanceof Error ? error.message : String(error);
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`N01_LOCAL_SERVER_START_TIMEOUT:port=${port}:status=${lastStatus}:body=${lastBody.slice(-1000)}`);
};

const json = async (response) => ({ status: response.status, body: await response.json().catch(() => ({})) });

try {
  await waitForHealth();

  const health = await json(await fetch(`${baseUrl}/api/soul-mesh/health`));
  if (health.status !== 200 || health.body.nucleus !== 'N01') throw new Error(`N01_CANONICAL_HEALTH_FAILED:${JSON.stringify(health)}`);

  const discovery = await json(await fetch(`${baseUrl}/api/soul-mesh/peers`));
  if (discovery.status !== 200 || discovery.body.nucleus !== 'N01' || discovery.body.protocol !== 'soul-mesh/1') {
    throw new Error(`N01_CANONICAL_DISCOVERY_FAILED:${JSON.stringify(discovery)}`);
  }

  const register = await json(await fetch(`${baseUrl}/api/soul-mesh/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ nucleus: 'N02', endpoint: 'http://127.0.0.1:19002', capabilities: ['ai.generate'], role: 'independent-ai' }),
  }));
  if (register.status !== 200 || register.body.registered !== 'N02' || typeof register.body.token !== 'string') {
    throw new Error(`N01_CANONICAL_REGISTER_FAILED:${JSON.stringify(register)}`);
  }

  const n07CorrelationId = crypto.randomUUID();
  const n07Response = await fetch(`${baseUrl}/api/soul-mesh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: crypto.randomUUID(),
      correlationId: n07CorrelationId, source: 'N07', target: 'N01', kind: 'response',
      capability: 'neural.forward', payload: { status: 'ok', values: [1, 2, 3] }, timestamp: Date.now(),
    }),
  });
  const n07Body = await n07Response.json();
  if (n07Response.status !== 200 || n07Body.source !== 'N07' || n07Body.target !== 'N01' || n07Body.kind !== 'response' || n07Body.correlationId !== n07CorrelationId || n07Body.contractVersion !== '1.1.0') {
    throw new Error(`N01_N07_RESPONSE_ROUTE_FAILED:${JSON.stringify(n07Body)}`);
  }

  const correlationId = crypto.randomUUID();
  const response = await fetch(`${baseUrl}/api/soul-mesh`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId },
    body: JSON.stringify({
      protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: crypto.randomUUID(),
      correlationId, source: 'N02', target: 'N01', kind: 'request', capability: 'mesh.ping',
      payload: { probe: 'local-runtime-contract' }, timestamp: Date.now(), nonce: crypto.randomUUID(),
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`N01_LOCAL_MESH_HTTP_${response.status}:${JSON.stringify(body)}`);
  const checks = {
    protocol: body.protocol === 'soul-mesh/1', contractVersion: body.contractVersion === '1.1.0',
    source: body.source === 'N01', target: body.target === 'N02', correlationId: body.correlationId === correlationId,
    kind: body.kind === 'response', capability: body.capability === 'mesh.ping',
  };
  const superGpuGuardResponse = await fetch(baseUrl + '/api/soul-mesh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: crypto.randomUUID(),
      correlationId: crypto.randomUUID(), source: 'N02', target: 'N01', kind: 'request',
      capability: 'mesh.supergpu.execute',
      payload: { task: { id: 'local-unsupported-capability-check', capability: 'clareira.ingest', payload: { probe: 'no-echo' } } },
      timestamp: Date.now(),
    }),
  });
  const superGpuGuardBody = await superGpuGuardResponse.json();
  if (superGpuGuardResponse.status !== 502 ||
      superGpuGuardBody.kind !== 'error' ||
      superGpuGuardBody.payload?.code !== 'SUPERGPU_EXECUTION_ERROR' ||
      !String(superGpuGuardBody.payload?.detail || '').includes('IN_PROCESS_EXECUTOR_UNAVAILABLE:clareira.ingest')) {
    throw new Error('SUPERGPU_LOCAL_EXECUTOR_GUARD_FAILED:' + JSON.stringify(superGpuGuardBody));
  }

  for (const [name, ok] of Object.entries(checks)) if (!ok) throw new Error(`N01_LOCAL_CONTRACT_${name.toUpperCase()}_FAILED:${JSON.stringify(body)}`);

  console.log(JSON.stringify({ stage: 'N01_LOCAL_RUNTIME_CONTRACT', ok: true, health: true, discovery: true, registration: true, n07ResponseRoute: true, superGpuLocalExecutorGuard: true, message: checks, correlationId, n07CorrelationId }, null, 2));
} finally {
  child.kill('SIGTERM');
  setTimeout(() => child.kill('SIGKILL'), 2_000).unref();
}
