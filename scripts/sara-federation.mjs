/**
 * SARA federation adapter for the N01 Soul gateway.
 *
 * SARA remains the owner of SARA operations. This adapter is transport glue:
 * it never invents a success response and never treats configuration as
 * proof of connectivity.
 */

const OPERATION_ROUTES = Object.freeze({
  'sara.health': { method: 'GET', path: '/health' },
  'sara.capabilities': { method: 'GET', path: '/v1/capabilities' },
  'sara.state': { method: 'GET', path: '/v1/state' },
  'sara.cycle': { method: 'POST', path: '/v1/cycle' },
  'sara.audit': { method: 'POST', path: '/v1/audit' },
  'sara.regenerate': { method: 'POST', path: '/v1/regenerate' },
  'sara.trace': { method: 'GET', path: '/v1/trace/{cycle_id}' },
});

function normalize(value) {
  return typeof value === 'string' ? value.trim().replace(/\/$/, '') : '';
}

function envValue(primary, fallback) {
  return normalize(process.env[primary] || process.env[fallback] || '');
}

function config() {
  return {
    baseUrl: envValue('SARA_SERVICE_URL', 'SARA_BASE_URL'),
    token: envValue('SARA_SERVICE_TOKEN', 'SARA_API_TOKEN'),
  };
}

export function saraConfigured() {
  const { baseUrl, token } = config();
  return Boolean(baseUrl && token);
}

export function saraHealthConfigured() {
  return Boolean(config().baseUrl);
}

export function saraDescribe() {
  const { baseUrl, token } = config();
  return {
    provider: 'SARA',
    protocol: 'sara-http/1',
    contractVersion: '1.0.0',
    configured: Boolean(baseUrl && token),
    credentialsPresent: Boolean(token),
    operations: Object.entries(OPERATION_ROUTES).map(([id, route]) => ({
      id,
      method: route.method,
      endpoint: route.path,
      owner: 'SARA',
    })),
    proofRule: {
      configured: 'URL + credential',
      connected: 'real request + correlated valid response',
      failure: 'explicit error; no synthetic success',
    },
  };
}

function routeFor(capability, payload) {
  const route = OPERATION_ROUTES[capability];
  if (!route) throw new Error('SARA_CAPABILITY_NOT_SUPPORTED');

  if (capability === 'sara.trace') {
    const cycleId = payload && typeof payload === 'object' ? String(payload.cycle_id || '').trim() : '';
    if (!cycleId) throw new Error('SARA_CYCLE_ID_REQUIRED');
    return { ...route, path: '/v1/trace/' + encodeURIComponent(cycleId) };
  }
  return route;
}

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function correlationFrom(payload, fallback) {
  if (isRecord(payload) && typeof payload.correlation_id === 'string' && payload.correlation_id.trim()) {
    return payload.correlation_id.trim();
  }
  if (isRecord(payload) && typeof payload.cycle_id === 'string' && payload.cycle_id.trim()) {
    return payload.cycle_id.trim();
  }
  return fallback;
}

function buildBody(capability, payload, correlationId) {
  if (capability === 'sara.cycle') {
    if (!isRecord(payload) || typeof payload.input !== 'string' || !payload.input.trim()) {
      throw new Error('SARA_INPUT_REQUIRED');
    }
    return {
      ...payload,
      cycle_id: typeof payload.cycle_id === 'string' && payload.cycle_id.trim()
        ? payload.cycle_id.trim()
        : correlationId,
    };
  }

  if (capability === 'sara.audit' || capability === 'sara.regenerate') {
    if (!isRecord(payload) || typeof payload.input !== 'string' || !payload.input.trim()) {
      throw new Error('SARA_INPUT_REQUIRED');
    }
    return { ...payload };
  }

  return undefined;
}

export async function requestSara(capability, payload = {}, correlationId) {
  const { baseUrl, token } = config();
  if (!baseUrl || (capability !== 'sara.health' && !token)) {
    throw new Error('SARA_SERVICE_NOT_CONFIGURED');
  }

  const route = routeFor(capability, payload);
  const correlation = correlationFrom(payload, normalize(correlationId) || crypto.randomUUID());
  const controller = new AbortController();
  const timeoutMs = Number(process.env.SARA_REQUEST_TIMEOUT_MS || 30_000);
  const timer = setTimeout(() => controller.abort(), Math.max(250, timeoutMs));

  try {
    const headers = {
      accept: 'application/json',
      'X-Correlation-ID': correlation,
    };
    const body = buildBody(capability, payload, correlation);
    if (route.method === 'POST') {
      headers['content-type'] = 'application/json';
      headers.authorization = 'Bearer ' + token;
    } else if (capability !== 'sara.health') {
      headers.authorization = 'Bearer ' + token;
    }

    const response = await fetch(baseUrl + route.path, {
      method: route.method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: controller.signal,
      cache: 'no-store',
    });
    const responsePayload = await response.json().catch(() => null);

    if (!response.ok) {
      const detail = isRecord(responsePayload) && 'error' in responsePayload
        ? JSON.stringify(responsePayload.error)
        : 'request failed';
      throw new Error('SARA_HTTP_' + response.status + ':' + detail);
    }

    if (!isRecord(responsePayload)) throw new Error('SARA_INVALID_RESPONSE');
    const echoedCorrelation = response.headers.get('X-Correlation-ID');
    if (echoedCorrelation && echoedCorrelation !== correlation) {
      throw new Error('SARA_CORRELATION_ID_MISMATCH');
    }
    if (
      capability !== 'sara.health' &&
      capability !== 'sara.state' &&
      capability !== 'sara.capabilities' &&
      capability !== 'sara.trace' &&
      typeof responsePayload.correlation_id === 'string' &&
      responsePayload.correlation_id !== correlation
    ) {
      throw new Error('SARA_CORRELATION_ID_MISMATCH');
    }

    return {
      capability,
      correlationId: correlation,
      provider: 'SARA',
      payload: responsePayload,
    };
  } finally {
    clearTimeout(timer);
  }
}

export { OPERATION_ROUTES };
