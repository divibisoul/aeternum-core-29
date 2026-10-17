import { randomUUID } from 'node:crypto';
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
const registrationTokenN04 = process.env.SOUL_MESH_N04_REGISTRATION_TOKEN?.trim();
const registrationTokenN05 = process.env.SOUL_MESH_N05_REGISTRATION_TOKEN?.trim();
if (!registrationTokenN04 || Buffer.byteLength(registrationTokenN04, 'utf8') < 32
  || !registrationTokenN05 || Buffer.byteLength(registrationTokenN05, 'utf8') < 32) {
  throw new Error('SOUL_MESH_N04_N05_REGISTRATION_CREDENTIALS_REQUIRED: independent 32+ byte credentials are required for the registration boundary E2E.');
}
const databaseUrl = process.env.POSTGRES_URL?.trim();
if (!databaseUrl) {
  throw new Error('SOUL_MESH_E2E_REAL_POSTGRES_URL_REQUIRED: configure the healthy PostgreSQL service; synthetic URLs are not accepted.');
}
const children = [];
const logs = new Map();

function start(name, args, cwd, env) {
  const childEnv = { ...process.env, ...env };
  // Registration credentials are needed only by N01 and the test harness.
  // Do not leak a different nucleus's bearer token into the N04 build/runtime.
  for (const key of Object.keys(childEnv)) {
    if (/^SOUL_MESH_N0[2-7]_REGISTRATION_TOKEN$/.test(key) && !Object.hasOwn(env, key)) {
      delete childEnv[key];
    }
  }
  const child = spawn(process.execPath, args, {
    cwd,
    env: childEnv,
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

function runN04Client(name, source, timeoutMs = 20000) {
  const driver = source.join('\n');
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
    child.on('error', error => rejectPromise(new Error(name + ' could not start: ' + error.message)));
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      rejectPromise(new Error(name + ' timeout\n' + captured));
    }, timeoutMs);
    child.on('exit', code => {
      clearTimeout(timer);
      if (code === 0 && captured.includes(name + '_PASS')) resolvePromise(captured.trim());
      else rejectPromise(new Error(name + ' failed with code=' + code + '\n' + captured));
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
  const n01 = start('N01 actual public Mesh gateway + private runtime', ['scripts/soul-mesh-server-entry.mjs'], n01Root, {
    NODE_ENV: 'production',
    SOUL_MESH_SECRET: secret,
    SOUL_MESH_HMAC_SECRET: secret,
    SOUL_MESH_N01_PORT: String(n01Port),
    SOUL_MESH_N01_HOST: '127.0.0.1',
    SOUL_MESH_N04_URL: n04Url,
    SOUL_MESH_N04_REGISTRATION_TOKEN: registrationTokenN04,
    SOUL_MESH_N05_REGISTRATION_TOKEN: registrationTokenN05,
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
    POSTGRES_URL: databaseUrl,
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

  // Exercise peer registration through the real public gateway. Missing credentials
  // must not mutate N04's current route, and one peer's credential cannot claim N05.
  async function discoveredPeers() {
    const response = await fetch(n01Url + '/mesh/discovery', {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) throw new Error('N01_REGISTRATION_DISCOVERY_FAILED:' + response.status);
    const body = await response.json().catch(() => null);
    if (!Array.isArray(body?.peers)) throw new Error('N01_REGISTRATION_DISCOVERY_INVALID');
    return body.peers;
  }
  const beforeRegistration = await discoveredPeers();
  const originalN04 = beforeRegistration.find(peer => peer.id === 'N04');
  if (!originalN04 || String(originalN04.url).replace(/\/$/, '') !== n04Url) {
    throw new Error('N01_REGISTRATION_TEST_PRECONDITION_FAILED: configured N04 endpoint is not visible.');
  }
  const originalN05 = beforeRegistration.find(peer => peer.id === 'N05') ?? null;
  for (const path of ['/mesh/register', '/api/soul-mesh/register']) {
    const response = await fetch(n01Url + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ nucleus: 'N04', endpoint: 'http://attacker.invalid', capabilities: ['mesh.ping'] }),
      signal: AbortSignal.timeout(3000),
    });
    const body = await response.json().catch(() => null);
    if (response.status !== 401 || body?.error !== 'MESH_REGISTRATION_AUTH_REQUIRED') {
      throw new Error('N01_PEER_REGISTRATION_UNAUTHENTICATED_ACCEPTED:' + path + ':' + response.status + ':' + String(body?.error));
    }
  }
  const crossIdentityRegistration = await fetch(n01Url + '/mesh/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + registrationTokenN04,
    },
    body: JSON.stringify({ nucleus: 'N05', endpoint: 'http://attacker.invalid', capabilities: ['mesh.ping'] }),
    signal: AbortSignal.timeout(3000),
  });
  const crossIdentityBody = await crossIdentityRegistration.json().catch(() => null);
  if (crossIdentityRegistration.status !== 401 || crossIdentityBody?.error !== 'MESH_REGISTRATION_AUTH_INVALID') {
    throw new Error('N01_PEER_REGISTRATION_CROSS_IDENTITY_ACCEPTED:' + crossIdentityRegistration.status + ':' + String(crossIdentityBody?.error));
  }
  const afterRejectedRegistrations = await discoveredPeers();
  const unchangedN04 = afterRejectedRegistrations.find(peer => peer.id === 'N04');
  const unchangedN05 = afterRejectedRegistrations.find(peer => peer.id === 'N05') ?? null;
  if (!unchangedN04 || String(unchangedN04.url).replace(/\/$/, '') !== n04Url
    || JSON.stringify(unchangedN05) !== JSON.stringify(originalN05)) {
    throw new Error('N01_PEER_REGISTRATION_UNAUTHORIZED_MUTATED_REGISTRY');
  }
  const authenticatedRegistration = await fetch(n01Url + '/api/soul-mesh/register', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer ' + registrationTokenN04,
    },
    body: JSON.stringify({
      nucleus: 'N04',
      endpoint: n04Url,
      role: 'independent-ai',
      capabilities: ['mesh.ping'],
    }),
    signal: AbortSignal.timeout(3000),
  });
  const authenticatedBody = await authenticatedRegistration.json().catch(() => null);
  if (authenticatedRegistration.status !== 200 || authenticatedBody?.registered !== 'N04') {
    throw new Error('N01_PEER_REGISTRATION_VALID_CREDENTIAL_REJECTED:' + authenticatedRegistration.status + ':' + String(authenticatedBody?.error));
  }
  const afterAuthenticatedRegistration = await discoveredPeers();
  const registeredN04 = afterAuthenticatedRegistration.find(peer => peer.id === 'N04');
  if (!registeredN04 || String(registeredN04.url).replace(/\/$/, '') !== n04Url) {
    throw new Error('N01_PEER_REGISTRATION_VALID_ENDPOINT_NOT_PRESERVED');
  }
  console.log('N01_PEER_REGISTRATION_AUTH_BOUNDARY_PASS ' + JSON.stringify({
    rejectedUnauthenticatedRoutes: ['/mesh/register', '/api/soul-mesh/register'],
    rejectedCrossIdentityRegistration: true,
    acceptedAuthenticatedN04Registration: true,
    attackerEndpointMutation: false,
  }));

  // Verify the actual public gateway rejects browser-relay traffic without a
  // Supabase access token before it can mint an N01 identity or reach any peer.
  const unauthenticatedBrowserRelay = await fetch(n01Url + '/api/soul-mesh/relay', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: n01Url,
      'sec-fetch-site': 'same-origin',
    },
    body: JSON.stringify({
      target: 'N07',
      capability: 'mesh.ping',
      payload: { probe: 'unauthenticated-browser-relay-must-fail-closed' },
      correlationId: 'n01-browser-auth-boundary',
    }),
    signal: AbortSignal.timeout(3000),
  });
  const unauthenticatedBody = await unauthenticatedBrowserRelay.json().catch(() => null);
  if (unauthenticatedBrowserRelay.status !== 401 || unauthenticatedBody?.error !== 'SOUL_MESH_BROWSER_SESSION_REQUIRED') {
    throw new Error('N01_BROWSER_RELAY_AUTH_BOUNDARY_FAILED: the real public gateway did not reject an unauthenticated browser request.');
  }
  const unauthenticatedSuperGPU = await fetch(n01Url + '/api/soul-mesh/supergpu', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: n01Url,
      'sec-fetch-site': 'same-origin',
    },
    body: JSON.stringify({
      target: 'N07',
      capability: 'mesh.supergpu.execute@1.0.0',
      payload: { values: [1], metadata: { operation: 'identity' } },
      correlationId: 'n01-supergpu-browser-auth-boundary',
    }),
    signal: AbortSignal.timeout(3000),
  });
  const unauthenticatedSuperGPUBody = await unauthenticatedSuperGPU.json().catch(() => null);
  if (unauthenticatedSuperGPU.status !== 401 || unauthenticatedSuperGPUBody?.error !== 'SOUL_MESH_BROWSER_SESSION_REQUIRED') {
    throw new Error('N01_SUPERGPU_BROWSER_AUTH_BOUNDARY_FAILED: the real public gateway did not reject unauthenticated SuperGPU execution.');
  }
  const browserRelayAuthEvidence = 'N01_BROWSER_RELAY_AUTH_BOUNDARY_PASS ' + JSON.stringify({
    gateway: 'N01 actual public HTTP gateway',
    routes: ['/api/soul-mesh/relay', '/api/soul-mesh/supergpu'],
    unauthenticatedStatus: unauthenticatedBrowserRelay.status,
    unauthenticatedSuperGPUStatus: unauthenticatedSuperGPU.status,
    accepted: false,
    targetReached: false,
  });

  // This peer request is generated by N04's real client module, not by a driver
  // claiming another nucleus identity. N04 -> N01 uses canonical request HMAC
  // and verifies N01's currently deployed legacy response signature.
  const directEvidence = await runN04Client('N04_TO_N01_REAL_PROCESS_E2E', [
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
  ]);

  // N04 itself initiates a delegation through N01. N01's actual forward() then
  // invokes N04's real production HTTP handler using canonical request HMAC and
  // must verify the canonical N04 response HMAC before replying to N04.
  const routedEvidence = await runN04Client('N04_VIA_N01_TO_N04_REAL_PROCESS_E2E', [
    "import assert from 'node:assert/strict';",
    "import * as peerClientModule from './lib/soul-mesh/peer-client.ts';",
    "const sendTo = peerClientModule.sendTo ?? peerClientModule.default?.sendTo;",
    "if (typeof sendTo !== 'function') throw new Error('N04_SEND_TO_EXPORT_MISSING');",
    "const r = await sendTo('N01', 'mesh.delegate', { target: 'N04', capability: 'mesh.ping', payload: { probe: 'N01_N04_REAL_PROCESS_PAIR', direction: 'N04_TO_N01_TO_N04' } }, 10000);",
    "assert.equal(r.source, 'N01');",
    "assert.equal(r.target, 'N04');",
    "assert.equal(r.kind, 'response');",
    "assert.equal(r.payload?.ok, true);",
    "assert.equal(r.payload?.nucleus, 'N04');",
    "console.log('N04_VIA_N01_TO_N04_REAL_PROCESS_E2E_PASS ' + JSON.stringify({caller:'N04 real peer client',gateway:'N01 actual HTTP runtime',destination:'N04 actual Next.js production route',capability:'mesh.ping',requestAuthentication:'HMAC-SHA256',N01VerifiedCanonicalN04ResponseHmac:true,N04VerifiedLegacyN01ResponseHmac:true,payload:r.payload}));",
  ]);

  console.log(JSON.stringify({
    system: 'SOUL',
    stage: 'N01_N04_REAL_PROCESS_PAIR_E2E',
    status: 'PASS',
    evidence: {
      browserRelayAuthBoundary: browserRelayAuthEvidence,
      n04ToN01: directEvidence,
      n04ViaN01ToN04: routedEvidence,
      independentN01Server: 'actual Node.js Soul Mesh HTTP runtime',
      independentN04Server: 'actual Next.js production HTTP runtime',
      initiatingIdentity: 'N04 peer-client implementation; no test driver impersonates a nucleus',
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
