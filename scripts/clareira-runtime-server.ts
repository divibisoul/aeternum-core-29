import http from 'node:http';
import { ClareiraBridge } from '../src/core/neural/ClareiraBridge.ts';
import { ProjetoClareira } from '../src/core/neural/ProjetoClareira.ts';
import { isClareiraPacket, type ClareiraPacket } from '../shared/clareira-contract.ts';

const port = Number(process.env.SOUL_CLAREIRA_RUNTIME_PORT || 0);
const host = process.env.SOUL_CLAREIRA_RUNTIME_HOST || '127.0.0.1';

function json(res: http.ServerResponse, status: number, body: unknown): void {
  const raw = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': String(raw.length),
  });
  res.end(raw);
}

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      json(res, 200, {
        ok: true,
        runtime: 'ProjetoClareira',
        bridge: 'ClareiraBridge',
        initialized: ProjetoClareira.initialized,
        running: ProjetoClareira.running,
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/v1/clareira/metrics') {
      json(res, 200, ClareiraBridge.metrics());
      return;
    }

    if (req.method === 'POST' && req.url === '/v1/clareira/ingest') {
      const body = await readBody(req);
      const packet = body && typeof body === 'object' ? (body as { packet?: unknown }).packet : undefined;
      if (!isClareiraPacket(packet)) {
        json(res, 400, { error: 'INVALID_CLAREIRA_PACKET' });
        return;
      }

      const accepted = await ClareiraBridge.ingest(packet as ClareiraPacket);
      json(res, accepted ? 200 : 503, {
        accepted,
        processed: accepted,
        correlation_id: packet.correlationId,
        runtime: 'ProjetoClareira',
        bridge: 'ClareiraBridge',
      });
      return;
    }

    json(res, 404, { error: 'NOT_FOUND' });
  } catch (error) {
    json(res, 500, {
      error: error instanceof Error ? error.message : 'CLAREIRA_RUNTIME_ERROR',
    });
  }
});

server.listen(port, host, () => {
  const address = server.address();
  const selected = typeof address === 'object' && address ? address.port : port;
  process.stdout.write(JSON.stringify({
    ok: true,
    runtime: 'ProjetoClareira',
    port: selected,
    host,
  }) + '\n');
});
