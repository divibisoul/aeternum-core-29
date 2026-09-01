import http from 'node:http';
import { spawn } from 'node:child_process';

const publicPort = Number(process.env.SOUL_MESH_N01_PORT || process.env.PORT || 8080);
const internalPort = publicPort + 1;
const host = process.env.SOUL_MESH_N01_HOST || '0.0.0.0';
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

async function maybeRouteCanonicalN07Response(req, res) {
  if (req.method !== 'POST' || req.url !== '/api/soul-mesh') return false;
  const raw = await readRequestBody(req);
  let message;
  try { message = JSON.parse(raw.toString('utf8')); } catch { return false; }
  if (message?.protocol !== 'soul-mesh/1' || message.source !== 'N07' || message.target !== 'N01') return false;
  if (message.contractVersion !== '1.1.0' || !message.id || !message.correlationId || !message.kind || !['response', 'error'].includes(message.kind)) {
    writeDirect(res, 400, { protocol: 'soul-mesh/1', contractVersion: '1.1.0', id: crypto.randomUUID(), correlationId: message.correlationId || crypto.randomUUID(), source: 'N01', target: 'N07', kind: 'error', capability: message.capability || '', payload: { error: 'INVALID_N07_RESPONSE_CONTRACT' }, timestamp: Date.now() });
    return true;
  }
  writeDirect(res, message.kind === 'error' ? 502 : 200, message);
  return true;
}

function proxy(req, res) {
  maybeRouteCanonicalN07Response(req, res).then(handled => {
    if (handled) return;
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
            if (parsed?.protocol === 'soul-mesh/1' && parsed.contractVersion !== '1.1.0') {
              parsed.contractVersion = '1.1.0';
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
    request.end();
  }).catch(error => {
    if (!res.headersSent) res.writeHead(400, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'SOUL_MESH_INGRESS_ERROR' }));
  });
}

const server = http.createServer(proxy);
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
