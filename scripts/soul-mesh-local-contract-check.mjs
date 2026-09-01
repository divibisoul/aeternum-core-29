import { spawn } from 'node:child_process';
import crypto from 'node:crypto';

const port = Number(process.env.SOUL_MESH_LOCAL_TEST_PORT || 18080);
const baseUrl = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ['scripts/soul-mesh-server-entry.mjs'], {
  env: { ...process.env, SOUL_MESH_N01_PORT: String(port), SOUL_MESH_N01_HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

const waitForHealth = async () => {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/mesh/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error('N01_LOCAL_SERVER_START_TIMEOUT');
};

try {
  await waitForHealth();
  const correlationId = crypto.randomUUID();
  const response = await fetch(`${baseUrl}/api/soul-mesh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-correlation-id': correlationId },
    body: JSON.stringify({
      protocol: 'soul-mesh/1',
      contractVersion: '1.1.0',
      id: crypto.randomUUID(),
      correlationId,
      source: 'N02',
      target: 'N01',
      kind: 'request',
      capability: 'mesh.ping',
      payload: { probe: 'local-runtime-contract' },
      timestamp: Date.now(),
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`N01_LOCAL_MESH_HTTP_${response.status}:${JSON.stringify(body)}`);
  const checks = {
    protocol: body.protocol === 'soul-mesh/1',
    contractVersion: body.contractVersion === '1.1.0',
    source: body.source === 'N01',
    target: body.target === 'N02',
    correlationId: body.correlationId === correlationId,
    kind: body.kind === 'response',
    capability: body.capability === 'mesh.ping',
  };
  for (const [name, ok] of Object.entries(checks)) if (!ok) throw new Error(`N01_LOCAL_CONTRACT_${name.toUpperCase()}_FAILED:${JSON.stringify(body)}`);
  console.log(JSON.stringify({ stage: 'N01_LOCAL_RUNTIME_CONTRACT', ok: true, ...checks, correlationId }, null, 2));
} finally {
  child.kill('SIGTERM');
  setTimeout(() => child.kill('SIGKILL'), 2_000).unref();
}
