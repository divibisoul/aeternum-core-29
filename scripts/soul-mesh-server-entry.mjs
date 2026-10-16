import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { isPublicN07StructuralCapability } from './soul-mesh-relay-policy.mjs';
import { canonicalOrderedJson } from './soul-mesh-canonical-json.mjs';

const publicPort = Number(process.env.SOUL_MESH_N01_PORT || process.env.PORT || 8080);
const internalPort = publicPort + 1;
const host = process.env.SOUL_MESH_N01_HOST || '0.0.0.0';
const N01_ENDPOINT = String(process.env.SOUL_MESH_N01_ENDPOINT || '').trim().replace(/\/$/, '') || `http://127.0.0.1:${publicPort}`;
const N07_URL = String(process.env.SOUL_MESH_N07_URL || '').trim().replace(/\/$/, '');
const SECRET = String(process.env.SOUL_MESH_SECRET || process.env.SOUL_MESH_HMAC_SECRET || '').trim();
const INTERNAL_RELAY_TOKEN = String(process.env.SOUL_MESH_INTERNAL_RELAY_TOKEN || crypto.randomBytes(32).toString('hex'));
const SUPABASE_URL = String(process.env.SOUL_MESH_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_PUBLISHABLE_KEY = String(process.env.SOUL_MESH_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();
const PROTOCOL = 'soul-mesh/1';
const CONTRACT_VERSION = '1.1.0';
const child = spawn(process.execPath, ['scripts/soul-mesh-server.mjs'], {
  // Keep the internal capability server private to the local reverse proxy.
  // Binding the child to 0.0.0.0 would expose the unwrapped internal port and
  // bypass the public gateway's N07 relay and request-boundary policies.
  env: {
    ...process.env,
    SOUL_MESH_N01_PORT: String(internalPort),
    SOUL_MESH_N01_HOST: '127.0.0.1',
    SOUL_MESH_INTERNAL_RELAY_TOKEN: INTERNAL_RELAY_TOKEN,
  },
  stdio: 'inherit',
});

function upstreamPath(reqUrl) {
  if (reqUrl === '/api/soul-mesh/register') return '/mesh/register';
  if (reqUrl === '/api/soul-mesh/peers' || reqUrl === '/api/soul-mesh/discovery') return '/mesh/discovery';
  if (reqUrl === '/api/soul-mesh/health') return '/mesh/health';
  return reqUrl;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > 2_000_000) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function writeDirect(res, status, body) {
  const output = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': String(output.length),
  });
  res.end(output);
}

function browserOriginAllowed(req) {
  const origin = String(req.headers.origin || '').trim();
  if (!origin || origin === 'null') return false;
  try {
    if (new URL(origin).origin !== origin) return false;
  } catch {
    return false;
  }
  const configuredOrigins = String(process.env.SOUL_MESH_BROWSER_ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
  if (configuredOrigins.includes(origin)) return true;
  // Browsers set this forbidden request header themselves. Cross-origin deployments
  // must explicitly list their frontend origin in SOUL_MESH_BROWSER_ALLOWED_ORIGINS.
  return String(req.headers['sec-fetch-site'] || '').toLowerCase() === 'same-origin';
}

async function requireBrowserAuthentication(req) {
  const authorization = String(req.headers.authorization || '');
  const match = /^Bearer\\s+([^\\s]+)$/i.exec(authorization);
  if (!match || match[1].length < 20) return { ok: false, status: 401, code: 'SOUL_MESH_BROWSER_SESSION_REQUIRED' };
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    return { ok: false, status: 503, code: 'SOUL_MESH_SUPABASE_AUTH_NOT_CONFIGURED' };
  }
  let authEndpoint;
  try {
    const base = new URL(SUPABASE_URL);
    if (base.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
      return { ok: false, status: 503, code: 'SOUL_MESH_SUPABASE_HTTPS_REQUIRED' };
    }
    authEndpoint = new URL('/auth/v1/user', base).toString();
  } catch {
    return { ok: false, status: 503, code: 'SOUL_MESH_SUPABASE_URL_INVALID' };
  }
  try {
    const response = await fetch(authEndpoint, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        authorization: `Bearer ${match[1]}`,
        accept: 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, status: 401, code: 'SOUL_MESH_BROWSER_SESSION_INVALID' };
    }
    if (!response.ok) return { ok: false, status: 503, code: 'SOUL_MESH_SUPABASE_AUTH_UNAVAILABLE' };
    const user = await response.json().catch(() => null);
    if (!user || typeof user.id !== 'string' || !user.id.trim()) {
      return { ok: false, status: 401, code: 'SOUL_MESH_BROWSER_SESSION_INVALID' };
    }
    return { ok: true, userId: user.id };
  } catch {
    return { ok: false, status: 503, code: 'SOUL_MESH_SUPABASE_AUTH_UNAVAILABLE' };
  }
}

function createBrowserMeshRequest(target, capability, payload, correlationId) {
  return {
    protocol: PROTOCOL,
    contractVersion: CONTRACT_VERSION,
    id: crypto.randomUUID(),
    correlationId,
    source: 'N01',
    target,
    kind: 'request',
    capability,
    payload,
    timestamp: Date.now(),
    meta: {
      runtime: 'aeternum-core-29',
      transport: 'HTTP',
      encoding: 'json',
      version: CONTRACT_VERSION,
      traceId: correlationId,
    },
  };
}

function validBrowserRelayResponse(body, target, capability, correlationId) {
  return Boolean(body && typeof body === 'object'
    && body.protocol === PROTOCOL
    && body.contractVersion === CONTRACT_VERSION
    && typeof body.id === 'string' && body.id
    && body.source === target && body.target === 'N01'
    && body.capability === capability
    && body.correlationId === correlationId
    && Number.isFinite(body.timestamp)
    && (body.kind === 'response' || body.kind === 'error'));
}

async function handleBrowserRelay(req, res, rawBody, legacyN07Route = false) {
  if (!browserOriginAllowed(req)) {
    writeDirect(res, 403, { error: 'SOUL_MESH_BROWSER_ORIGIN_REJECTED' });
    return;
  }
  const authorization = await requireBrowserAuthentication(req);
  if (!authorization.ok) {
    writeDirect(res, authorization.status, { error: authorization.code });
    return;
  }
  if (!SECRET || Buffer.byteLength(SECRET, 'utf8') < 32) {
    writeDirect(res, 503, { error: 'SOUL_MESH_HMAC_SECRET_NOT_CONFIGURED' });
    return;
  }

  let input;
  try {
    input = JSON.parse(rawBody.toString('utf8'));
  } catch {
    writeDirect(res, 400, { error: 'INVALID_JSON' });
    return;
  }
  const target = legacyN07Route ? 'N07' : input?.target;
  const capability = typeof input?.capability === 'string' ? input.capability.trim() : '';
  const correlationId = typeof input?.correlationId === 'string' ? input.correlationId.trim() : '';
  if (!/^[A-Za-z0-9][A-Za-z0-9._:@/-]{0,255}$/.test(capability)) {
    writeDirect(res, 400, { error: 'BROWSER_RELAY_CAPABILITY_INVALID' });
    return;
  }
  if (!/^[A-Za-z0-9._:/-]{1,128}$/.test(correlationId)) {
    writeDirect(res, 400, { error: 'BROWSER_RELAY_CORRELATION_INVALID' });
    return;
  }
  if (target === 'N07') {
    if (!isPublicN07StructuralCapability(capability)) {
      writeDirect(res, 403, { error: 'N07_STRUCTURAL_CAPABILITY_ONLY' });
      return;
    }
    try {
      const result = await relayToN07(createBrowserMeshRequest('N07', capability, input.payload ?? {}, correlationId));
      if (!validBrowserRelayResponse(result, 'N07', capability, correlationId)) {
        writeDirect(res, 502, { error: 'SOUL_MESH_N07_RESPONSE_CONTRACT_INVALID' });
        return;
      }
      writeDirect(res, result.kind === 'error' ? 502 : 200, result);
    } catch (error) {
      writeDirect(res, 502, { error: error instanceof Error ? error.message : 'SOUL_MESH_N07_RELAY_FAILED' });
    }
    return;
  }
  if (!['N02', 'N03', 'N04', 'N05', 'N06'].includes(target)) {
    writeDirect(res, 403, { error: 'SOUL_MESH_BROWSER_RELAY_TARGET_NOT_ALLOWED' });
    return;
  }

  try {
    const response = await fetch(`http://127.0.0.1:${internalPort}/mesh/browser-relay`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-soul-mesh-internal-token': INTERNAL_RELAY_TOKEN,
      },
      body: JSON.stringify({ target, capability, payload: input.payload ?? {}, correlationId }),
      cache: 'no-store',
      signal: AbortSignal.timeout(35_000),
    });
    const result = await response.json().catch(() => null);
    if (!validBrowserRelayResponse(result, target, capability, correlationId)) {
      writeDirect(res, 502, { error: 'SOUL_MESH_PEER_RESPONSE_CONTRACT_INVALID' });
      return;
    }
    writeDirect(res, result.kind === 'error' ? 502 : (response.ok ? 200 : response.status), result);
  } catch {
    writeDirect(res, 502, { error: 'SOUL_MESH_PEER_RELAY_UNAVAILABLE' });
  }
}

function canonicalN07Relay(message, nonce) {
  // Preserve the outer Go-struct field order; sort every nested map exactly
  // like encoding/json. This also covers integer-like JSON keys deterministically.
  return canonicalOrderedJson([
    ['protocol', message.protocol],
    ['contractVersion', message.contractVersion],
    ['id', message.id],
    ['correlationId', message.correlationId],
    ['source', message.source],
    ['target', message.target],
    ['kind', message.kind],
    ['capability', message.capability],
    ['payload', message.payload ?? null],
    ['timestamp', message.timestamp],
    ['transport', message.meta?.transport ?? null],
    ['meta', message.meta ?? null],
    ['nonce', nonce],
  ]);
}

function signN07Relay(message, nonce) {
  return crypto.createHmac('sha256', SECRET).update(canonicalN07Relay(message, nonce)).digest('hex');
}

function verifyN07Response(message) {
  if (!message || message.protocol !== PROTOCOL || message.contractVersion !== CONTRACT_VERSION) throw new Error('INVALID_N07_RESPONSE_CONTRACT');
  if (message.source !== 'N07' || message.target !== 'N01') throw new Error('INVALID_N07_RESPONSE_ROUTE');
  if (!message.id || !['response', 'error'].includes(message.kind) || typeof message.capability !== 'string' || !message.payload || typeof message.payload !== 'object' || Array.isArray(message.payload)) throw new Error('INVALID_N07_RESPONSE_ENVELOPE');
  if (!message.correlationId || !message.nonce || !message.hmac) throw new Error('INVALID_N07_RESPONSE_AUTH');
  if (!Number.isFinite(message.timestamp) || Math.abs(Date.now() - message.timestamp) > 30_000) throw new Error('N07_RESPONSE_TIMESTAMP_OUT_OF_RANGE');
  const canonical = canonicalOrderedJson([
    ['version', '1.0'],
    ['contractVersion', message.contractVersion],
    ['messageId', message.id],
    ['source', message.source],
    ['target', message.target],
    ['timestamp', message.timestamp],
    ['nonce', message.nonce],
    ['correlationId', message.correlationId],
    ['type', message.kind === 'error' ? 'ERROR' : 'TASK_RESULT'],
    ['payload', { capability: message.capability || '', payload: message.payload || {} }],
    ['operation', message.operation],
    ['metadata', message.metadata],
  ]);
  const expected = crypto.createHmac('sha256', SECRET).update(canonical).digest('hex');
  const actual = String(message.hmac);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) throw new Error('N07_RESPONSE_HMAC_INVALID');
}

async function relayToN07(message) {
  if (!N07_URL) throw new Error('SOUL_MESH_N07_URL_NOT_CONFIGURED');
  if (!SECRET || SECRET.length < 16) throw new Error('SOUL_MESH_SECRET_NOT_CONFIGURED');
  if (!message || message.protocol !== PROTOCOL || message.contractVersion !== CONTRACT_VERSION || message.source !== 'N01' || message.target !== 'N07') throw new Error('INVALID_N01_TO_N07_REQUEST');
  if (!message.id || !message.correlationId || message.kind !== 'request' || !message.capability || !Number.isFinite(message.timestamp)) throw new Error('INVALID_N01_TO_N07_REQUEST');
  const nonce = crypto.randomUUID();
  const signature = signN07Relay(message, nonce);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${N07_URL}/api/soul-mesh`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-soul-correlation-id': message.correlationId,
        'x-soul-mesh-nonce': nonce,
        'x-soul-mesh-hmac': signature,
      },
      body: JSON.stringify(message),
      signal: controller.signal,
      cache: 'no-store',
    });
    const body = await response.json().catch(() => ({}));
    if (body.correlationId !== message.correlationId) throw new Error('N07_CORRELATION_MISMATCH');
    verifyN07Response(body);
    // Accept only authenticated, correlated Mesh envelopes. HTTP error status is
    // interpreted after signature validation so N07's structured error is preserved.
    if (!response.ok && body.kind !== 'error') throw new Error(`N07_HTTP_${response.status}`);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function proxy(req, res) {
  const rawBody = req.method === 'POST' ? await readRequestBody(req) : Buffer.alloc(0);

  const requestPath = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`).pathname;
  if (req.method === 'POST' && (requestPath === '/api/soul-mesh/relay' || requestPath === '/api/soul-mesh/n07')) {
    await handleBrowserRelay(req, res, rawBody, requestPath === '/api/soul-mesh/n07');
    return;
  }

  if (req.method === 'POST' && req.url === '/api/soul-mesh') {
    try {
      const message = JSON.parse(rawBody.toString('utf8'));
      if (message?.protocol === PROTOCOL && message.source === 'N07' && message.target === 'N01') {
        if (message.contractVersion !== CONTRACT_VERSION || !message.id || !message.correlationId || !['response', 'error'].includes(message.kind)) {
          writeDirect(res, 400, {
            protocol: PROTOCOL, contractVersion: CONTRACT_VERSION, id: crypto.randomUUID(),
            correlationId: message.correlationId || crypto.randomUUID(), source: 'N01', target: 'N07',
            kind: 'error', capability: message.capability || '',
            payload: { error: 'INVALID_N07_RESPONSE_CONTRACT' }, timestamp: Date.now(),
          });
          return;
        }
        if (process.env.NODE_ENV === 'production' && Buffer.byteLength(SECRET, 'utf8') < 32) {
          writeDirect(res, 503, { error: 'SOUL_MESH_HMAC_SECRET_NOT_CONFIGURED' });
          return;
        }
        if (SECRET) verifyN07Response(message);
        writeDirect(res, message.kind === 'error' ? 502 : 200, message);
        return;
      }
    } catch {
      // Let the internal server return its normal INVALID_JSON response.
    }
  }

  const requestPath = upstreamPath(req.url);
  const headers = { ...req.headers, host: `127.0.0.1:${internalPort}` };
  const request = http.request({ hostname: '127.0.0.1', port: internalPort, path: requestPath, method: req.method, headers }, (upstream) => {
    const chunks = [];
    upstream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    upstream.on('end', () => {
      const body = Buffer.concat(chunks);
      const contentType = String(upstream.headers['content-type'] || '');
      let output = body;
      if (req.url?.startsWith('/api/soul-mesh') && contentType.includes('application/json')) {
        try {
          const parsed = JSON.parse(body.toString('utf8'));
          if (parsed?.protocol === PROTOCOL && parsed.contractVersion !== CONTRACT_VERSION) {
            parsed.contractVersion = CONTRACT_VERSION;
            output = Buffer.from(JSON.stringify(parsed));
          }
        } catch {
          output = body;
        }
      }
      const responseHeaders = { ...upstream.headers, 'content-length': String(output.length) };
      delete responseHeaders['transfer-encoding'];
      res.writeHead(upstream.statusCode || 502, responseHeaders);
      res.end(output);
    });
  });
  request.on('error', error => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'SOUL_MESH_UPSTREAM_ERROR', detail: error.message }));
  });
  request.end(rawBody);
}

const server = http.createServer((req, res) => proxy(req, res).catch(error => {
  if (!res.headersSent) res.writeHead(400, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'SOUL_MESH_INGRESS_ERROR' }));
}));
server.on('error', error => {
  console.error(`Soul Mesh public ingress bind error on ${host}:${publicPort}:`, error);
  child.kill('SIGTERM');
  process.exitCode = 1;
});
async function registerWithN07() {
  if (!N07_URL) throw new Error('SOUL_MESH_N07_URL_NOT_CONFIGURED');
  const message = {
    protocol: PROTOCOL,
    contractVersion: CONTRACT_VERSION,
    id: crypto.randomUUID(),
    correlationId: `n01-register-${crypto.randomUUID()}`,
    source: 'N01',
    target: 'N07',
    kind: 'request',
    capability: 'mesh.register@1.0.0',
    payload: {
      endpoint: N01_ENDPOINT,
      role: 'host-reference-gateway',
      capabilities: [
        'mesh.ping',
        'mesh.health',
        'mesh.discovery',
        'mesh.register',
        'grce.cycle.execute@1.0.0'
      ]
    },
    timestamp: Date.now(),
    meta: { transport: 'HTTP', runtime: 'aeternum-core-29' }
  };
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try {
      const response = await relayToN07(message);
      if (response?.kind !== 'error') return response;
    } catch (error) {
      if (attempt === 20) throw error;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw new Error('N01_N07_REGISTRATION_FAILED');
}

server.listen(publicPort, host, () => {
  registerWithN07()
    .then(() => console.log(`SOUL N01 registered in N07 via canonical Mesh endpoint ${N07_URL}`))
    .catch(error => console.error('SOUL N01 registration in N07 blocked:', error));
});

function shutdown(signal) {
  server.close(() => child.kill('SIGTERM'));
  setTimeout(() => child.kill('SIGKILL'), 5_000).unref();
  console.log(`Soul Mesh ingress stopped (${signal})`);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
child.on('error', error => {
  console.error('Soul Mesh internal child spawn error:', error);
});

child.on('exit', (code, signal) => {
  console.error(`Soul Mesh internal child exited (code=${code ?? 'null'}, signal=${signal ?? 'null'})`);
  if (code !== 0 && signal === null) process.exit(code ?? 1);
});
