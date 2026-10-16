import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const n01Root = process.env.SOUL_N01_WORKDIR || process.cwd();
const n04Root = process.env.SOUL_N04_WORKDIR;
if (!n04Root || !existsSync(resolve(n04Root, 'node_modules/next/dist/bin/next'))) {
  throw new Error('N04 production dependencies/build are required before real-process E2E.');
}

const n01Port = Number(process.env.SOUL_TEST_N01_PORT || 18801);
const n04Port = Number(process.env.SOUL_TEST_N04_PORT || 18404);
const n01Url = 'http://127.0.0.1:' + n01Port;
const n04Url = 'http://127.0.0.1:' + n04Port;
const secret = process.env.SOUL_MESH_SECRET || process.env.SOUL_MESH_HMAC_SECRET || randomUUID() + randomUUID();
const token = process.env.SOUL_MESH_TOKEN || randomUUID() + randomUUID();
const children = [];
const logs = new Map();

function start(name, args, cwd, env) {
  const child = spawn(process.execPath, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(child);
  logs.set(name, '');
  const collect = chunk => logs.set(name, (logs.get(name) + String(chunk)).slice(-24000));
  child.stdout.on('data', collect);
  child.stderr.on('data', collect);
  child.on('error', error => collect(String(error)));
  return child;
}

function assertRunning(name, child) {
  if (child.exitCode !== null || child.signalCode !== null) {
    throw new Error(name + ' exited before E2E completion.\n' + logs.get(name));
  }
}

async function waitFor(name, child, probe) {
  let last = 'no response';
  for (let i = 0; i < 100; i += 1) {
    assertRunning(name, child);
    try {
      if (await probe()) return;
      last = 'probe returned unexpected response';
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise(resolveDelay => setTimeout(resolveDelay, 200));
  }
  throw new Error(name + ' did not become ready: ' + last + '\n' + logs.get(name));
}

function canonicalRequest(message, nonce) {
  return JSON.stringify({
    protocol: message.protocol,
    contractVersion: message.contractVersion,
    id: message.id,
    correlationId: message.correlationId,
    source: message.source,
    target: message.target,
    kind: message.kind,
    capability: message.capability ?? null,
    payload: message.payload,
    timestamp: message.timestamp,
    transport: message.meta?.transport,
    meta: message.meta ?? null,
    nonce,
  });
}

function legacyResponseCanonical(message, nonce) {
  return JSON.stringify({
    version: '1.0',
    contractVersion: message.contractVersion,
    messageId: message.id,
    source: message.source,
    target: message.target,
    timestamp: message.timestamp,
    nonce,
    correlationId: message.correlationId,
    type: message.kind === 'error' ? 'ERROR' : 'TASK_RESULT',
    payload: { capability: message.capability ?? '', payload: message.payload ?? {} },
  });
}

function safeHexEqual(actualHex, expectedHex) {
  if (!/^[0-9a-f]{64}$/i.test(actualHex)) return false;
  const actual = Buffer.from(actualHex, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

async function exerciseN01ToN04() {
  const nonce = randomUUID().replaceAll('-', '').padEnd(32, '0').slice(0, 32);
  const correlationId = 'n01-n04-real-process-' + randomUUID();
  const message = {
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: randomUUID(),
    correlationId,
    source: 'N02',
    target: 'N01',
    kind: 'request',
    capability: 'mesh.delegate',
    payload: {
      target: 'N04',
      capability: 'mesh.ping',
      payload: { probe: 'N01_N04_REAL_PROCESS_PAIR', direction: 'N01_TO_N04' },
    },
    timestamp: Date.now(),
    meta: {
      runtime: 'n01-n04-real-process-e2e-driver',
      transport: 'HTTP',
      encoding: 'json',
      version: '1.1.0',
      nonce,
      traceId: correlationId,
    },
    nonce,
  };
  const requestHmac = createHmac('sha256', secret)
    .update(canonicalRequest(message, nonce), 'utf8')
    .digest('hex');

  const response = await fetch(n01Url + '/api/soul-mesh', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      'x-soul-correlation-id': correlationId,
      'x-soul-mesh-nonce': nonce,
      'x-soul-mesh-hmac': requestHmac,
    },
    body: JSON.stringify(message),
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  const body = await response.json().catch(() => null);
  if (!body || body.protocol !== 'soul-mesh/1' || body.contractVersion !== '1.1.0'
    || body.source !== 'N01' || body.target !== 'N02'
    || body.correlationId !== correlationId || body.kind !== 'response') {
    throw new Error('N01_TO_N04_OUTER_RESPONSE_CONTRACT_FAILED:' + response.status + ':' + JSON.stringify(body));
  }

  const responseNonce = String(body.nonce ?? body.meta?.nonce ?? '');
  const suppliedHmac = String(body.hmac ?? '');
  const expectedHmac = createHmac('sha256', secret)
    .update(legacyResponseCanonical(body, responseNonce), 'utf8')
    .digest('hex');
  if (!safeHexEqual(suppliedHmac, expectedHmac)) throw new Error('N01_TO_N04_OUTER_RESPONSE_HMAC_INVALID');
  if (!response.ok || body.payload?.ok !== true || body.payload?.nucleus !== 'N04') {
    throw new Error('N01_TO_N04_PEER_FORWARD_FAILED:' + response.status + ':' + JSON.stringify(body.payload));
  }
  return {
    marker: 'N01_TO_N04_REAL_PROCESS_E2E_PASS',
    source: 'N01',
    target: 'N04',
    capability: 'mesh.ping',
    transport: 'HTTP',
    requestAuthentication: 'HMAC-SHA256',
    N04ResponseHmacVerifiedByN01Gateway: true,
    outerN01ResponseHmacVerifiedByDriver: true,
    correlationId,
    payload: body.payload,
  };
}

function exerciseN04ToN01(timeoutMs = 20000) {
  const driver = [
    "import assert from 'node:assert/strict';",
    "import * as peerClientModule from './lib/soul-mesh/peer-client.ts';",
    "const sendTo = peerClientModule.sendTo ?? peerClientModule.default?.sendTo;",
    "if (typeof sendTo !== 'function') throw new Error('N04_SEND_TO_EXPORT_MISSING');",
    "const r = await sendTo('N01', 'mesh.ping', { probe: 'N01_N04_REAL_PROCESS_PAIR', direction: 'N04_TO_N01' }, 7000);",
    "assert.equal(r.protocol, 'soul-mesh/1');",
    "assert.equal(r.contractVersion, '1.1.0');",
    "assert.equal(r.source, 'N01');",
    "assert.equal(r.target, 'N04');",
    "assert.equal(r.kind, 'response');",
    "assert.equal(r.payload?.ok, true);",
    "assert.equal(r.payload?.nucleus, 'N01');",
    "console.log('N04_TO_N01_REAL_PROCESS_E2E_PASS ' + JSON.stringify({source:'N04',target:'N01',capability:'mesh.ping',transport:'HTTP',requestAuthentication:'HMAC-SHA256',responseAuthentication:'legacy HMAC-SHA256 verified by N04',payload:r.payload}));",
  ].join('\n');

  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '-e', driver], {
      cwd: n04Root,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        SOUL_MESH_SECRET: secret,
        SOUL_MESH_HMAC_SECRET: secret,
        SOUL_MESH_TOKEN: token,
        SOUL_MESH_N01_URL: n01Url,
        SOUL_MESH_N04_URL: n04Url,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let captured = '';
    const collect = chunk => { captured = (captured + String(chunk)).slice(-24000); };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', error => rejectPromise(new Error('N04 peer client could not start: ' + error.message)));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      rejectPromise(new Error('N04_TO_N01_E2E_TIMEOUT\n' + captured));
    }, timeoutMs);
    child.on('exit', code => {
      clearTimeout(timer);
      if (code === 0 && captured.includes('N04_TO_N01_REAL_PROCESS_E2E_PASS')) resolvePromise(captured.trim());
      else rejectPromise(new Error('N04_TO_N01_E2E_FAILED code=' + code + '\n' + captured));
    });
  });
}

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolveExit => child.once('exit', resolveExit)),
    new Promise(resolveDelay => setTimeout(resolveDelay, 4000)),
  ]);
  if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
}

try {
  const n01 = start('N01 actual HTTP Mesh runtime', ['scripts/soul-mesh-server.mjs'], n01Root, {
    NODE_ENV: 'production',
    SOUL_MESH_SECRET: secret,
    SOUL_MESH_HMAC_SECRET: secret,
    SOUL_MESH_N01_PORT: String(n01Port),
    SOUL_MESH_N01_HOST: '127.0.0.1',
    SOUL_MESH_N04_URL: n04Url,
  });
  const n04 = start('N04 actual Next.js production runtime', [
    resolve(n04Root, 'node_modules/next/dist/bin/next'),
    'start',
    '--hostname', '127.0.0.1',
    '--port', String(n04Port),
  ], n04Root, {
    NODE_ENV: 'production',
    PORT: String(n04Port),
    HOSTNAME: '127.0.0.1',
    AUTH_SECRET: process.env.AUTH_SECRET || randomUUID() + randomUUID(),
    POSTGRES_URL: process.env.POSTGRES_URL || 'postgresql://soulmesh:soulmesh@127.0.0.1:5432/soulmesh',
    SOUL_MESH_SECRET: secret,
    SOUL_MESH_HMAC_SECRET: secret,
    SOUL_MESH_TOKEN: token,
    SOUL_MESH_N01_URL: n01Url,
    SOUL_MESH_N04_URL: n04Url,
  });

  await Promise.all([
    waitFor('N01', n01, async () => {
      const response = await fetch(n01Url + '/mesh/health', {
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      });
      const body = await response.json().catch(() => null);
      return response.ok && body?.nucleus === 'N01';
    }),
    waitFor('N04', n04, async () => {
      const response = await fetch(n04Url + '/api/soul-mesh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{',
        signal: AbortSignal.timeout(3000),
      });
      return response.status === 400;
    }),
  ]);

  // Actual N01 request -> actual N01 route -> actual N04 production process.
  const n01Evidence = await exerciseN01ToN04();
  // Actual N04 peer client -> actual N01 Node Mesh process.
  const n04Evidence = await exerciseN04ToN01();

  console.log(JSON.stringify({
    system: 'SOUL',
    stage: 'N01_N04_REAL_PROCESS_PAIR_E2E',
    status: 'PASS',
    evidence: {
      n01ToN04: n01Evidence,
      n04ToN01: n04Evidence,
      independentN01Server: 'actual Node.js Soul Mesh HTTP runtime',
      independentN04Server: 'actual Next.js production HTTP runtime',
      secrets: 'ephemeral process environment; never committed',
      endpointMocks: false,
    },
    checkedAt: new Date().toISOString(),
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    system: 'SOUL',
    stage: 'N01_N04_REAL_PROCESS_PAIR_E2E',
    status: 'FAILED',
    error: error instanceof Error ? error.message : String(error),
    serverLogs: Object.fromEntries(logs),
  }, null, 2));
  process.exitCode = 1;
} finally {
  await Promise.all(children.reverse().map(stop));
}
