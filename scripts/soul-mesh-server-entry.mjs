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

function proxy(req, res) {
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
  req.pipe(request);
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
