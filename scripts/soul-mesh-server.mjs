import http from 'node:http';

const PORT = Number(process.env.SOUL_MESH_PORT ?? 8781);
const NUCLEUS = 'N01';
const PROTOCOL = 'soul-mesh/1';
const CAPABILITIES = ['mesh.ping', 'mesh.health', 'mesh.capabilities'];

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,authorization' });
  res.end(JSON.stringify(body));
}
function envelope(kind, message = {}) { return { protocol: PROTOCOL, nucleus: NUCLEUS, kind, correlationId: message.correlationId ?? crypto.randomUUID(), timestamp: new Date().toISOString() }; }
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.url !== '/api/soul-mesh') return send(res, 404, { error: 'NOT_FOUND' });
  if (req.method === 'GET') return send(res, 200, { ...envelope('health'), status: 'ready', receiver: '/api/soul-mesh', capabilities: CAPABILITIES });
  if (req.method !== 'POST') return send(res, 405, { error: 'METHOD_NOT_ALLOWED' });
  try {
    const chunks = []; for await (const chunk of req) chunks.push(chunk);
    const message = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (message.protocol !== PROTOCOL) return send(res, 400, { ...envelope('error', message), code: 'PROTOCOL_UNSUPPORTED' });
    if (message.target && message.target !== NUCLEUS) return send(res, 400, { ...envelope('error', message), code: 'TARGET_MISMATCH' });
    const capability = message.capability ?? message.kind;
    if (capability === 'mesh.ping' || capability === 'mesh.health') return send(res, 200, { ...envelope('response', message), capability, result: { ok: true, nucleus: NUCLEUS }, proof: 'EXECUTED' });
    if (capability === 'mesh.capabilities') return send(res, 200, { ...envelope('response', message), capability, capabilities: CAPABILITIES, proof: 'EXECUTED' });
    return send(res, 404, { ...envelope('error', message), code: 'CAPABILITY_HANDLER_NOT_REGISTERED', capability });
  } catch { return send(res, 400, { ...envelope('error'), code: 'INVALID_JSON' }); }
});
server.listen(PORT, '0.0.0.0', () => console.log(`Soul Mesh ${NUCLEUS} listening on :${PORT}/api/soul-mesh`));
