import http from 'node:http';
import crypto from 'node:crypto';
import process from 'node:process';
import { inferInitialIntent } from './n01-byok-gemini.mjs';

const HOST = String(process.env.SOUL_FUSION_MODEL_HOST || '127.0.0.1');
const PORT = Number(process.env.SOUL_FUSION_MODEL_PORT || 18070);
const TOKEN = String(process.env.SOUL_FUSION_MODEL_TOKEN || '').trim();
const MODEL = String(process.env.GEMINI_MODEL || 'gemini-3.8-flash').trim();
const MAX_BODY_BYTES = 32_000;

function writeJson(res, status, body) {
  const output = Buffer.from(JSON.stringify(body));
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': String(output.length) });
  res.end(output);
}

function authorized(req) {
  if (!TOKEN || TOKEN.length < 32) return false;
  const header = String(req.headers.authorization || '');
  if (!/^Bearer\s+/i.test(header)) return false;
  const actual = Buffer.from(header.replace(/^Bearer\s+/i, '').trim());
  const expected = Buffer.from(TOKEN);
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', chunk => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error('MODEL_REQUEST_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(Buffer.from(chunk));
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new Error('MODEL_REQUEST_INVALID_JSON')); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  if (req.method === 'GET' && url.pathname === '/health') {
    const ready = Boolean(TOKEN.length >= 32 && process.env.GEMINI_API_KEY?.trim());
    writeJson(res, ready ? 200 : 503, { ready, service: 'soul-fusion-model-adapter', provider: 'google-gemini', model: MODEL, contract: 'soul-fusion-execution@0.1.0' });
    return;
  }
  if (req.method !== 'POST' || url.pathname !== '/v1/infer') {
    writeJson(res, 404, { error: 'NOT_FOUND' });
    return;
  }
  if (!authorized(req)) {
    writeJson(res, 401, { error: 'MODEL_ADAPTER_UNAUTHORIZED' });
    return;
  }
  let request;
  try { request = await readJson(req); }
  catch (error) {
    writeJson(res, error.message === 'MODEL_REQUEST_TOO_LARGE' ? 413 : 400, { error: error.message });
    return;
  }
  if (request?.contract_name !== 'soul-fusion-execution' || request?.schema_version !== '0.1.0'
      || typeof request.message_id !== 'string' || !request.message_id
      || typeof request.correlation_id !== 'string' || !request.correlation_id
      || typeof request.trace_id !== 'string' || !request.trace_id
      || typeof request.text !== 'string' || !request.text.trim() || request.text.length > 8000
      || request.correlation_id !== String(req.headers['x-correlation-id'] || '')
      || request.trace_id !== String(req.headers['x-soul-trace-id'] || '')) {
    writeJson(res, 400, { error: 'MODEL_ADAPTER_INVALID_CONTRACT' });
    return;
  }
  if (!process.env.GEMINI_API_KEY?.trim()) {
    writeJson(res, 503, { error: 'GEMINI_API_KEY_REQUIRED' });
    return;
  }

  const startedAt = Date.now();
  console.log(JSON.stringify({ event: 'soul.fusion.model.started', trace_id: request.trace_id, correlation_id: request.correlation_id, message_id: request.message_id, provider: 'google-gemini', model: request.model || MODEL }));
  try {
    const result = await inferInitialIntent({
      text: request.text,
      model: String(request.model || MODEL),
      correlationId: request.correlation_id,
      sessionId: 'soul-fusion-' + request.correlation_id,
    });
    if (result.provider !== 'google-gemini' || result.correlationId !== request.correlation_id || !String(result.summary || '').trim()) {
      throw new Error('MODEL_PROVIDER_OR_CORRELATION_INVALID');
    }
    const body = {
      contract_name: 'soul-fusion-execution', schema_version: '0.1.0',
      message_id: crypto.randomUUID(), trace_id: request.trace_id, correlation_id: request.correlation_id,
      provider: result.provider, model: result.model,
      result: { intent: result.intent, summary: result.summary, capabilities: result.capabilities, confidence: result.confidence },
      latency_ms: Date.now() - startedAt,
    };
    console.log(JSON.stringify({ event: 'soul.fusion.model.completed', status: 'SUCCEEDED', trace_id: body.trace_id, correlation_id: body.correlation_id, message_id: body.message_id, provider: body.provider, model: body.model, latency_ms: body.latency_ms }));
    writeJson(res, 200, body);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'MODEL_INFERENCE_FAILED';
    console.error(JSON.stringify({ event: 'soul.fusion.model.failed', trace_id: request.trace_id, correlation_id: request.correlation_id, code: detail }));
    writeJson(res, 502, { error: detail, trace_id: request.trace_id, correlation_id: request.correlation_id });
  }
});

server.listen(PORT, HOST, () => {
  console.log(JSON.stringify({ event: 'soul.fusion.model.listening', host: HOST, port: PORT, provider: 'google-gemini', model: MODEL, auth_configured: TOKEN.length >= 32 }));
});

function shutdown(signal) {
  console.log(JSON.stringify({ event: 'soul.fusion.model.shutdown', signal }));
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
