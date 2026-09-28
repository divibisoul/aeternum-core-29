import { spawn } from 'node:child_process';
import crypto from 'node:crypto';

const port = Number(process.env.SOUL_MESH_LOCAL_TEST_PORT || 18080);
const baseUrl = `http://127.0.0.1:${port}`;
const SECRET = process.env.SOUL_MESH_HMAC_SECRET?.trim() || 'n01-local-contract-secret-2026';

function signModern(message) {
  const canonical = JSON.stringify({
    protocol: message.protocol,
    contractVersion: message.contractVersion,
    id: message.id,
    correlationId: message.correlationId,
    source: message.source,
    target: message.target,
    kind: message.kind,
    capability: message.capability,
    payload: message.payload || {},
    timestamp: message.timestamp,
    transport: message.meta?.transport ?? null,
    meta: message.meta ?? null,
    nonce: message.nonce,
  });
  return crypto.createHmac('sha256', SECRET).update(canonical, 'utf8').digest('hex');
}

function modernRequest(source, capability, payload) {
  const message = {
    protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: crypto.randomUUID(),
    correlationId: crypto.randomUUID(), source, target: 'N01', kind: 'request', capability,
    payload, timestamp: Date.now(), nonce: crypto.randomUUID(),
    meta: { runtime: source, transport: 'HTTP', encoding: 'json', version: '1.1.0' },
  };
  return {
    message,
    headers: {
      'content-type': 'application/json',
      'x-soul-mesh-nonce': message.nonce,
      'x-soul-mesh-hmac': signModern(message),
      'x-correlation-id': message.correlationId,
    },
  };
}
const child = spawn(process.execPath, ['scripts/soul-mesh-server-entry.mjs'], {
  env: { ...process.env, SOUL_MESH_N01_PORT: String(port), SOUL_MESH_N01_HOST: '127.0.0.1', SOUL_MESH_HMAC_SECRET: SECRET, SOUL_MESH_SECRET: SECRET, SOUL_MESH_LOCAL_TEST_DIAGNOSTICS: '1' },
  stdio: ['ignore', 'inherit', 'inherit'],
});

const waitForHealth = async () => {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/soul-mesh/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('N01_LOCAL_SERVER_START_TIMEOUT');
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
  const n07Id = crypto.randomUUID();
  const n07Nonce = crypto.randomUUID();
  const n07Timestamp = Date.now();
  const n07ResponseUnsigned = {
    version: '1.0', contractVersion: '1.1.0', messageId: n07Id, source: 'N07', target: 'N01',
    timestamp: n07Timestamp, nonce: n07Nonce, correlationId: n07CorrelationId, type: 'TASK_RESULT',
    payload: { capability: 'neural.forward', payload: { status: 'ok', values: [1, 2, 3] } },
  };
  const n07Hmac = crypto.createHmac('sha256', SECRET).update(JSON.stringify(n07ResponseUnsigned), 'utf8').digest('hex');
  const n07Response = await fetch(baseUrl + '/api/soul-mesh', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: n07Id,
      correlationId: n07CorrelationId, source: 'N07', target: 'N01', kind: 'response',
      capability: 'neural.forward', payload: { status: 'ok', values: [1, 2, 3] }, timestamp: n07Timestamp,
      nonce: n07Nonce, hmac: n07Hmac, version: '1.0', messageId: n07Id, type: 'TASK_RESULT',
    }),
  });
  const n07Body = await n07Response.json();
  if (n07Response.status !== 200 || n07Body.source !== 'N07' || n07Body.target !== 'N01' || n07Body.kind !== 'response' || n07Body.correlationId !== n07CorrelationId || n07Body.contractVersion !== '1.1.0') {
    throw new Error(`N01_N07_RESPONSE_ROUTE_FAILED:${JSON.stringify(n07Body)}`);
  }

  const pingRequest = modernRequest('N02', 'mesh.ping', { probe: 'local-runtime-contract' });
  const correlationId = pingRequest.message.correlationId;
  const response = await fetch(baseUrl + '/api/soul-mesh', {
    method: 'POST',
    headers: pingRequest.headers,
    body: JSON.stringify(pingRequest.message),
  });
  const body = await response.json();
  if (!response.ok) {
    const clientCanonical = JSON.stringify({
      protocol: pingRequest.message.protocol,
      contractVersion: pingRequest.message.contractVersion,
      id: pingRequest.message.id,
      correlationId: pingRequest.message.correlationId,
      source: pingRequest.message.source,
      target: pingRequest.message.target,
      kind: pingRequest.message.kind,
      capability: pingRequest.message.capability,
      payload: pingRequest.message.payload || {},
      timestamp: pingRequest.message.timestamp,
      transport: pingRequest.message.meta?.transport ?? null,
      meta: pingRequest.message.meta ?? null,
      nonce: pingRequest.message.nonce,
    });
    const clientCanonicalFingerprint = crypto.createHash('sha256').update(clientCanonical, 'utf8').digest('hex');
    const secretFingerprint = crypto.createHash('sha256').update(SECRET, 'utf8').digest('hex');
    throw new Error(`N01_LOCAL_MESH_HTTP_${response.status}:${JSON.stringify(body)}:clientCanonicalLength=${clientCanonical.length}:clientCanonicalFingerprint=${clientCanonicalFingerprint}:secretFingerprint=${secretFingerprint}`);
  }
  const checks = {
    protocol: body.protocol === 'soul-mesh/1', contractVersion: body.contractVersion === '1.1.0',
    source: body.source === 'N01', target: body.target === 'N02', correlationId: body.correlationId === correlationId,
    kind: body.kind === 'response', capability: body.capability === 'mesh.ping',
  };
  const superGpuRequest = modernRequest('N02', 'mesh.supergpu.execute', {
    task: { id: 'local-unsupported-capability-check', capability: 'clareira.ingest', payload: { probe: 'no-echo' } },
  });
  const superGpuGuardResponse = await fetch(baseUrl + '/api/soul-mesh', {
    method: 'POST',
    headers: superGpuRequest.headers,
    body: JSON.stringify(superGpuRequest.message),
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
