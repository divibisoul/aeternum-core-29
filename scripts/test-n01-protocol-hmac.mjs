import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { verifyPeerResponseHmac } from './soul-mesh-peer-response-auth.mjs';

const secret = 'soul-lote3-n01-n02-hmac-test-secret';
const port = 19127;
const baseUrl = `http://127.0.0.1:${port}`;

function canonical(message, nonce) {
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
    transport: message.meta?.transport ?? null,
    meta: message.meta ?? null,
    nonce,
  });
}

function responseCanonical(body, nonce) {
  return JSON.stringify({
    version: '1.0',
    contractVersion: body.contractVersion,
    messageId: body.id,
    source: body.source,
    target: body.target,
    timestamp: body.timestamp,
    nonce,
    correlationId: body.correlationId,
    type: body.kind === 'error' ? 'ERROR' : 'TASK_RESULT',
    payload: { capability: body.capability ?? '', payload: body.payload ?? {} },
  });
}

function makeMessage(correlationId = crypto.randomUUID()) {
  const nonce = crypto.randomUUID().replaceAll('-', '').padEnd(32, '0').slice(0, 32);
  const message = {
    protocol: 'soul-mesh/1',
    contractVersion: '1.1.0',
    id: crypto.randomUUID(),
    correlationId,
    source: 'N02',
    target: 'N01',
    kind: 'request',
    capability: 'mesh.ping',
    payload: { probe: 'n01-protocol-hmac' },
    timestamp: Date.now(),
    meta: {
      runtime: 'Eternium-',
      transport: 'HTTP',
      encoding: 'json',
      version: '1.1.0',
      nonce,
      traceId: correlationId,
    },
  };
  message.nonce = nonce;
  message.hmac = crypto.createHmac('sha256', secret).update(canonical(message, nonce), 'utf8').digest('hex');
  return { message, nonce };
}

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/mesh/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('N01_PROTOCOL_HMAC_SERVER_START_TIMEOUT');
}

const child = spawn(process.execPath, ['scripts/soul-mesh-server.mjs'], {
  env: { ...process.env, SOUL_MESH_SECRET: secret, SOUL_MESH_N01_PORT: String(port), SOUL_MESH_N01_HOST: '127.0.0.1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer();

  const { message, nonce } = makeMessage();
  const requestHeaders = {
    'content-type': 'application/json',
    'x-soul-mesh-nonce': nonce,
    'x-soul-mesh-hmac': message.hmac,
    'x-correlation-id': message.correlationId,
  };

  const first = await fetch(`${baseUrl}/api/soul-mesh`, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(message),
  });
  const firstBody = await first.json();

  if (first.status !== 200) {
    throw new Error(`N01_PROTOCOL_HMAC_FIRST_HTTP_${first.status}:${JSON.stringify(firstBody)}`);
  }
  if (firstBody.source !== 'N01' || firstBody.target !== 'N02' || firstBody.correlationId !== message.correlationId) {
    throw new Error('N01_PROTOCOL_HMAC_RESPONSE_IDENTITY_FAILED');
  }

  const responseNonce = String(firstBody.nonce ?? firstBody.meta?.nonce ?? '');
  const responseHmac = String(firstBody.hmac ?? '');
  if (!responseNonce || !/^[0-9a-f]{32}$/i.test(responseNonce) || !/^[0-9a-f]{64}$/i.test(responseHmac)) {
    throw new Error('N01_PROTOCOL_HMAC_RESPONSE_SIGNATURE_MISSING');
  }

  const expectedResponseHmac = crypto
    .createHmac('sha256', secret)
    .update(responseCanonical(firstBody, responseNonce), 'utf8')
    .digest('hex');

  if (responseHmac !== expectedResponseHmac) {
    throw new Error('N01_PROTOCOL_HMAC_RESPONSE_SIGNATURE_INVALID');
  }

  const replay = await fetch(`${baseUrl}/api/soul-mesh`, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(message),
  });
  const replayBody = await replay.json().catch(() => null);
  if (replay.status !== 409 || replayBody?.error !== undefined && replayBody?.payload?.code !== undefined) {
    if (replay.status !== 400) throw new Error(`N01_PROTOCOL_HMAC_REPLAY_NOT_REJECTED:${replay.status}:${JSON.stringify(replayBody)}`);
  }


  // Verify the actual peer-response contract matrix used by N01's outbound gateway.
  // Signatures are independently generated here from each established wire format.
  function makePeerResponse(target, scheme) {
    const nonce = crypto.randomUUID().replaceAll('-', '').padEnd(32, '0').slice(0, 32);
    const message = {
      protocol: 'soul-mesh/1',
      contractVersion: '1.1.0',
      id: crypto.randomUUID(),
      correlationId: `n01-response-matrix-${target}`,
      source: target,
      target: 'N01',
      kind: 'response',
      capability: 'mesh.ping',
      payload: { ok: true, nucleus: target },
      timestamp: Date.now(),
      nonce,
      meta: {
        runtime: `${target}-contract-fixture`,
        transport: 'HTTP',
        encoding: 'json',
        version: '1.1.0',
        nonce,
        traceId: `n01-response-matrix-${target}`,
      },
    };
    const canonicalValue = scheme === 'canonical'
      ? canonical(message, nonce)
      : responseCanonical(message, nonce);
    const hmac = crypto.createHmac('sha256', secret).update(canonicalValue, 'utf8').digest('hex');
    return { message, nonce, hmac };
  }

  for (const target of ['N02', 'N03', 'N04', 'N05', 'N06', 'N07']) {
    for (const scheme of ['canonical', 'legacy']) {
      const signed = makePeerResponse(target, scheme);
      const valid = verifyPeerResponseHmac(signed.message, target, secret, signed.nonce, signed.hmac);
      const expected = target === 'N02' || target === 'N07'
        ? scheme === 'legacy'
        : target === 'N05' || target === 'N06'
          ? scheme === 'canonical'
          : true;
      assert.equal(valid, expected, `peer-response auth contract mismatch for ${target}/${scheme}`);
      assert.equal(
        verifyPeerResponseHmac(signed.message, target, secret, signed.nonce, '0'.repeat(64)),
        false,
        `tampered response HMAC must fail for ${target}/${scheme}`,
      );
    }
  }

  const result = {
    stage: 'N01_PROTOCOL_HMAC_COMPATIBILITY',
    status: 'PASS',
    request: { hmac: true, nonce: true, correlation: true },
    response: { hmac: true, nonce: true, correlation: firstBody.correlationId === message.correlationId },
    replayRejected: replay.status === 409,
  };
  console.log(JSON.stringify(result, null, 2));
} finally {
  child.kill('SIGTERM');
  setTimeout(() => child.kill('SIGKILL'), 1_000).unref();
}
