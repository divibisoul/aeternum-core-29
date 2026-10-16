import { createHmac, timingSafeEqual } from 'node:crypto';

const LEGACY_ONLY_PEERS = new Set(['N02', 'N07']);
const CANONICAL_ONLY_PEERS = new Set(['N05', 'N06']);
const TRANSITIONAL_PEERS = new Set(['N03', 'N04']);

function canonicalModernResponse(message, nonce) {
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
    transport: message.meta?.transport,
    meta: message.meta ?? null,
    nonce,
  });
}

function canonicalLegacyResponse(message, nonce) {
  return JSON.stringify({
    version: '1.0',
    contractVersion: message.contractVersion,
    messageId: message.id,
    source: message.source,
    target: message.target,
    timestamp: message.timestamp,
    nonce,
    correlationId: message.correlationId,
    type: message.kind === 'error' ? 'ERROR' : 'TASK_RESULT',
    payload: {
      capability: message.capability ?? '',
      payload: message.payload ?? {},
    },
  });
}

function matchesDigest(suppliedHex, expectedHex) {
  if (!/^[0-9a-f]{64}$/i.test(suppliedHex)) return false;
  const supplied = Buffer.from(suppliedHex, 'hex');
  const expected = Buffer.from(expectedHex, 'hex');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

/**
 * Verify a peer response using its live contract generation.
 * N02/N07 remain legacy-only; N05/N06 use canonical Mesh; N03/N04
 * temporarily accept either signed generation while their servers migrate.
 * Unknown peers fail closed; no unsigned or unchecked fallback is allowed.
 */
export function verifyPeerResponseHmac(message, target, secret, nonce, suppliedHmac) {
  if (!message || typeof message !== 'object' || !secret || !nonce) return false;
  const supplied = String(suppliedHmac ?? '').trim();
  if (!/^[0-9a-f]{64}$/i.test(supplied)) return false;
  if (!Number.isFinite(message.timestamp)) return false;
  if (!['response', 'error'].includes(message.kind)) return false;
  if (!message.correlationId || !message.id || !message.source || !message.target) return false;

  let canonicalValid = false;
  let legacyValid = false;
  try {
    const canonical = createHmac('sha256', secret)
      .update(canonicalModernResponse(message, nonce), 'utf8')
      .digest('hex');
    canonicalValid = matchesDigest(supplied, canonical);
    const legacy = createHmac('sha256', secret)
      .update(canonicalLegacyResponse(message, nonce), 'utf8')
      .digest('hex');
    legacyValid = matchesDigest(supplied, legacy);
  } catch {
    return false;
  }

  if (LEGACY_ONLY_PEERS.has(target)) return legacyValid;
  if (CANONICAL_ONLY_PEERS.has(target)) return canonicalValid;
  if (TRANSITIONAL_PEERS.has(target)) return canonicalValid || legacyValid;
  return false;
}
