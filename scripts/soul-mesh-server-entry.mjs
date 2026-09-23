import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';

const publicPort = Number(process.env.SOUL_MESH_N01_PORT || process.env.PORT || 8080);
const internalPort = publicPort + 1;
const host = process.env.SOUL_MESH_N01_HOST || '0.0.0.0';
const N07_URL = String(process.env.SOUL_MESH_N07_URL || '').trim().replace(/\/$/, '');
const SECRET = String(process.env.SOUL_MESH_SECRET || process.env.SOUL_MESH_HMAC_SECRET || '').trim();
const PROTOCOL = 'soul-mesh/1';
const CONTRACT_VERSION = '1.1.0';
const child = spawn(process.execPath, ['scripts/soul-mesh-server.mjs'], {
  env: { ...process.env, SOUL_MESH_N01_PORT: String(internalPort) },
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

function canonicalN07Relay(message, nonce) {
  return JSON.stringify({
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
    transport: message.meta?.transport,
    meta: message.meta,
    nonce,
  });
}

function signN07Relay(message, nonce) {
  return crypto.createHmac('sha256', SECRET).update(canonicalN07Relay(message, nonce)).digest('hex');
}

function verifyN07Response(message) {
  if (!message || message.protocol !== PROTOCOL || message.contractVersion !== CONTRACT_VERSION) throw new Error('INVALID_N07_RESPONSE_CONTRACT');
  if (message.source !== 'N07' || message.target !== 'N01') throw new Error('INVALID_N07_RESPONSE_ROUTE');
  if (!message.correlationId || !message.nonce || !message.hmac) throw new Error('INVALID_N07_RESPONSE_AUTH');
  if (!Number.isFinite(message.timestamp) || Math.abs(Date.now() - message.timestamp) > 30_000) throw new Error('N07_RESPONSE_TIMESTAMP_OUT_OF_RANGE');
  const unsigned = {
    version: '1.0',
    contractVersion: message.contractVersion,
    messageId: message.id,
    source: message.source,
    target: message.target,
    timestamp: message.timestamp,
    nonce: message.nonce,
    correlationId: message.correlationId,
    type: message.kind === 'error' ? 'ERROR' : 'TASK_RESULT',
    payload: { capability: message.capability || '', payload: message.payload || {} },
    operation: message.operation,
    metadata: message.metadata,
  };
  const canonical = JSON.stringify(unsigned);
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
    if (!response.ok) throw new Error(`N07_HTTP_${response.status}`);
    if (body.correlationId !== message.correlationId) throw new Error('N07_CORRELATION_MISMATCH');
    verifyN07Response(body);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function proxy(req, res) {
  const rawBody = req.method === 'POST' ? await readRequestBody(req) : Buffer.alloc(0);

  if (req.method === 'POST' && req.url === '/api/soul-mesh/n07') {
    try {
      const message = JSON.parse(rawBody.toString('utf8'));
      if (message?.source !== 'N01' || message?.target !== 'N07') {
        writeDirect(res, 400, { error: 'N01_N07_ROUTE_REQUIRED' });
        return;
      }
      const body = await relayToN07(message);
      writeDirect(res, body.kind === 'error' ? 502 : 200, body);
      return;
    } catch (error) {
      writeDirect(res, 502, { error: error instanceof Error ? error.message : 'N07_RELAY_ERROR' });
      return;
    }
  }

  if (req.method === 'POST' && req.url === '/api/soul-mesh') {
    try {
      const message = JSON.parse(rawBody.toString('utf8'));
      if (message?.protocol === PROTOCOL && message.source === 'N07' && message.target === 'N01') {
        if (message.kind === 'request') {
          // N07→N01 is a real inbound request; only N01 responses are terminated here.
          // Forward the request to the canonical internal Mesh runtime below.
        } else {
          if (message.contractVersion !== CONTRACT_VERSION || !message.id || !message.correlationId || !['response', 'error'].includes(message.kind)) {
            writeDirect(res, 400, {
              protocol: PROTOCOL, contractVersion: CONTRACT_VERSION, id: crypto.randomUUID(),
              correlationId: message.correlationId || crypto.randomUUID(), source: 'N01', target: 'N07',
              kind: 'error', capability: message.capability || '',
              payload: { error: 'INVALID_N07_RESPONSE_CONTRACT' }, timestamp: Date.now(),
            });
            return;
          }
          if (SECRET && SECRET.length >= 16) verifyN07Response(message);
          writeDirect(res, message.kind === 'error' ? 502 : 200, message);
          return;
        }
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
server.listen(publicPort, host);

function shutdown(signal) {
  server.close(() => child.kill('SIGTERM'));
  setTimeout(() => child.kill('SIGKILL'), 5_000).unref();
  console.log(`Soul Mesh ingress stopped (${signal})`);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
child.on('exit', (code, signal) => {
  if (code !== 0 && signal === null) process.exit(code ?? 1);
});
