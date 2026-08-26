import { SoulRuntimeRegistry, type SoulNucleusId, type SoulTransport } from './runtime-registry';

export interface HybridDispatchRequest {
  id: string;
  correlationId: string;
  source: SoulNucleusId;
  target: SoulNucleusId;
  capability: string;
  payload: unknown;
}

export interface HybridDispatchResult {
  id: string;
  correlationId: string;
  target: SoulNucleusId;
  capability: string;
  transport: SoulTransport;
  executed: boolean;
  output?: unknown;
  error?: string;
}

export type TransportSender = (transport: SoulTransport, endpoint: string, request: HybridDispatchRequest) => Promise<unknown>;

export async function dispatchHybrid(
  registry: SoulRuntimeRegistry,
  request: HybridDispatchRequest,
  send: TransportSender,
): Promise<HybridDispatchResult> {
  const route = registry.resolve(request.capability);
  if (!route || route.owner !== request.target) {
    return { ...request, transport: 'HTTP', executed: false, error: 'CAPABILITY_ROUTE_NOT_FOUND' };
  }

  const runtime = registry.getRuntime(request.target);
  if (!runtime || !runtime.endpoint) {
    return { ...request, transport: route.transports[0] ?? 'HTTP', executed: false, error: 'RUNTIME_ENDPOINT_NOT_CONFIGURED' };
  }

  let lastError = 'DISPATCH_FAILED';
  for (const transport of route.transports) {
    try {
      const output = await send(transport, runtime.endpoint, request);
      return { ...request, transport, executed: true, output };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return { ...request, transport: route.transports[0] ?? 'HTTP', executed: false, error: lastError };
}
