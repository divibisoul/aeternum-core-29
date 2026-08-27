import type { Plugin, ViteDevServer } from 'vite';
import { SoulMeshRouter } from './src/core/mesh/SoulMeshRouter';
import { N01MeshIngress } from './src/core/mesh/N01MeshIngress';
import { N01SessionAuth, type N01SessionTokenRecord, type N01SessionTokenStore } from './src/core/mesh/N01SessionAuth';
import { N01_PEERS, type N01PeerId } from './src/core/mesh/N01Channels';
import type { SoulMeshMessage, SoulMeshTransport } from './src/core/mesh/SoulMeshProtocol';
import { SOUL_MESH_CONTRACT_VERSION, SOUL_MESH_PROTOCOL } from './src/core/mesh/SoulMeshProtocol';

class MemorySessionStore implements N01SessionTokenStore {
  private readonly records = new Map<N01PeerId, N01SessionTokenRecord>();
  async save(record: N01SessionTokenRecord): Promise<void> { this.records.set(record.peerId, record); }
  async get(peerId: N01PeerId): Promise<N01SessionTokenRecord | undefined> { return this.records.get(peerId); }
  async list(): Promise<N01SessionTokenRecord[]> { return [...this.records.values()]; }
  async remove(peerId: N01PeerId): Promise<void> { this.records.delete(peerId); }
}

class DevTransport implements SoulMeshTransport {
  private readonly listeners = new Set<(message: SoulMeshMessage) => void | Promise<void>>();
  async send(_message: SoulMeshMessage): Promise<void> {}
  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void { this.listeners.add(handler); return () => this.listeners.delete(handler); }
}

function readBody(req: { on(event: 'data', listener: (chunk: Buffer) => void): unknown; on(event: 'end', listener: () => void): unknown; on(event: 'error', listener: (error: Error) => void): unknown }): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || 'null')); }
      catch { reject(new Error('INVALID_JSON')); }
    });
  });
}

function json(res: { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void }, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.end(JSON.stringify(payload));
}

function makeMockPeerResponse(peer: N01PeerId, message: SoulMeshMessage): SoulMeshMessage {
  return {
    protocol: SOUL_MESH_PROTOCOL,
    contractVersion: SOUL_MESH_CONTRACT_VERSION,
    id: crypto.randomUUID(),
    correlationId: message.correlationId,
    source: peer,
    target: 'N01',
    kind: 'response',
    capability: message.capability,
    payload: { mock: true, peer, echoed: message.payload, acknowledgedAt: Date.now() },
    timestamp: Date.now(),
  };
}

export function n01MeshDevHttpPlugin(): Plugin {
  return {
    name: 'soul-n01-mesh-http-dev',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      const auth = new N01SessionAuth(new MemorySessionStore());
      const transport = new DevTransport();
      const router = new SoulMeshRouter(transport, 'N01');
      const ingress = new N01MeshIngress(router, auth);
      const tokens = new Map<N01PeerId, string>();

      router.onRequest('mesh.echo', async message => ({ nucleus: 'N01', echoed: message.payload, timestamp: Date.now() }));
      router.onRequest('mesh.diagnostic.event', async message => ({ nucleus: 'N01', acknowledged: true, echoed: message.payload, timestamp: Date.now() }));
      router.onRequest('mesh.health', async () => ({ nucleus: 'N01', healthy: true, timestamp: Date.now() }));

      server.middlewares.use(async (req, res, next) => {
        const method = req.method ?? 'GET';
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;

        if (method === 'GET' && pathname === '/mesh/dev/status') {
          json(res, 200, { protocol: SOUL_MESH_PROTOCOL, nucleus: 'N01', routes: N01_PEERS.map(peer => `/mesh/in/${peer}`), mockPeers: N01_PEERS.map(peer => `/mesh/mock-peer/${peer}`) });
          return;
        }

        const registerMatch = pathname.match(/^\/mesh\/dev\/register\/(N02|N03|N04|N05|N06)$/);
        if (method === 'POST' && registerMatch) {
          const peer = registerMatch[1] as N01PeerId;
          const record = await auth.issue(peer);
          tokens.set(peer, record.token);
          json(res, 200, { peerId: peer, token: record.token, endpoint: `${new URL(req.url ?? '/', 'http://localhost').origin}/mesh/mock-peer/${peer}` });
          return;
        }

        const inboundMatch = pathname.match(/^\/mesh\/in\/(N02|N03|N04|N05|N06)$/);
        if (method === 'POST' && inboundMatch) {
          const peer = inboundMatch[1] as N01PeerId;
          try {
            const message = await readBody(req) as SoulMeshMessage;
            const response = await ingress.accept(peer, message, typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined);
            json(res, response ? 200 : 202, response ?? { accepted: true });
          } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            const status = reason.includes('UNAUTHORIZED') ? 401 : reason.includes('INVALID') || reason.includes('IDENTITY') ? 400 : 500;
            json(res, status, { error: reason });
          }
          return;
        }

        const mockMatch = pathname.match(/^\/mesh\/mock-peer\/(N02|N03|N04|N05|N06)$/);
        if (method === 'POST' && mockMatch) {
          const peer = mockMatch[1] as N01PeerId;
          const expected = tokens.get(peer);
          const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
          if (!expected || authHeader !== `Bearer ${expected}`) { json(res, 401, { error: 'MOCK_PEER_UNAUTHORIZED' }); return; }
          try {
            const message = await readBody(req) as SoulMeshMessage;
            json(res, 200, makeMockPeerResponse(peer, message));
          } catch (error) {
            json(res, 400, { error: error instanceof Error ? error.message : String(error) });
          }
          return;
        }

        next();
      });

      server.httpServer?.once('close', () => router.close());
    },
  };
}
