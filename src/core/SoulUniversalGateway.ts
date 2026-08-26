import { endpointFor, type NucleusId, discoverSoulRuntimes } from './SoulMeshServiceDiscovery';

export type SoulGatewayMessage = {
  protocol: 'soul-mesh/1'; id: string; correlationId: string; source: NucleusId; target: NucleusId;
  kind: 'request'; capability: string; payload: unknown; timestamp: string; channelId: string;
};

export type SoulGatewayResult = {
  response: unknown;
  target: NucleusId;
  transport: 'HTTP' | 'LOOPBACK_HTTP' | 'REALTIME' | 'WEBVIEW_BRIDGE' | 'IN_PROCESS';
};

const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

/**
 * User-facing N01 gateway. It routes any capability to its owning nucleus without
 * copying ownership into N01. Transport fallback is attempted before a capability
 * is reported unavailable.
 */
export async function dispatchFromSoulGateway(
  target: NucleusId,
  capability: string,
  payload: unknown,
  options: { source?: NucleusId; token?: string; bridge?: (message: SoulGatewayMessage) => Promise<unknown> } = {},
): Promise<SoulGatewayResult> {
  const source = options.source ?? 'N01';
  if (source === target) throw new Error('SOUL_GATEWAY_SELF_ROUTE');
  const runtime = endpointFor(target);
  const message: SoulGatewayMessage = {
    protocol: 'soul-mesh/1', id: makeId(), correlationId: makeId(), source, target,
    kind: 'request', capability, payload, timestamp: new Date().toISOString(), channelId: `${source}.OUT.${target}`,
  };

  if (options.bridge && runtime.transports.includes('WEBVIEW_BRIDGE')) {
    try { return { response: await options.bridge(message), target, transport: 'WEBVIEW_BRIDGE' }; } catch { /* fallback below */ }
  }
  if (!runtime.endpoint) throw new Error(`SOUL_RUNTIME_ENDPOINT_UNAVAILABLE:${target}`);

  let lastError: unknown;
  for (const transport of runtime.transports) {
    if (transport !== 'HTTP' && transport !== 'LOOPBACK_HTTP') continue;
    try {
      const response = await fetch(runtime.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(options.token ? { authorization: `Bearer ${options.token}` } : {}) },
        body: JSON.stringify({ ...message, transport }),
      });
      if (!response.ok) throw new Error(`SOUL_MESH_HTTP_${response.status}`);
      const body = await response.json();
      if (body?.correlationId !== message.correlationId) throw new Error('SOUL_MESH_CORRELATION_MISMATCH');
      if (body?.kind === 'error') throw new Error(body?.payload?.code ?? 'SOUL_MESH_REMOTE_ERROR');
      return { response: body, target, transport };
    } catch (error) { lastError = error; }
  }
  throw lastError instanceof Error ? lastError : new Error(`SOUL_RUNTIME_UNREACHABLE:${target}`);
}

export function availableSoulRuntimes() { return discoverSoulRuntimes(); }
