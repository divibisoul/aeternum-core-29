/**
 * PROJETO CLAREIRA — ponte SOUL -> N01 -> SARA.
 *
 * O cliente não finge que SARA recebeu o estado: a confirmação vem da
 * resposta HTTP do gateway N01, que por sua vez confirma o adapter SARA.
 */
import type { ClareiraSnapshot } from './types';

let bridgeSequence = 0;

function correlationId(prefix = 'clareira'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  bridgeSequence += 1;
  return `${prefix}-${Date.now()}-${bridgeSequence}`;
}

export interface ClareiraSaraResponse {
  ok: boolean;
  nucleus?: string;
  capability?: string;
  correlationId: string;
  result?: Record<string, unknown>;
  error?: string;
}

export class ClareiraSaraBridge {
  readonly version = '1.0.0';

  constructor(private readonly gatewayBaseUrl = '/api/clareira') {}

  async syncState(
    snapshot: ClareiraSnapshot,
    correlation?: string,
  ): Promise<ClareiraSaraResponse> {
    return this.request(
      '/state',
      snapshot,
      correlation ?? correlationId('clareira-state'),
    );
  }

  async dispatchVagalCommand(
    nodeId: string,
    command: 'calm' | 'turbo' | 'reduce_thermal' | 'shutdown' | 'resume',
    payload: Record<string, unknown> = {},
    priority = 0.5,
    correlation?: string,
  ): Promise<ClareiraSaraResponse> {
    if (!nodeId.trim()) throw new Error('CLAREIRA_NODE_ID_REQUIRED');
    return this.request(
      '/vagus',
      {
        node_id: nodeId,
        command,
        payload,
        priority,
      },
      correlation ?? correlationId('clareira-vagal'),
    );
  }

  private async request(
    path: string,
    payload: Record<string, unknown> | ClareiraSnapshot,
    correlation: string,
  ): Promise<ClareiraSaraResponse> {
    const response = await fetch(this.gatewayBaseUrl.replace(/\/$/, '') + path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-correlation-id': correlation,
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const body = await response.json().catch(() => null) as Record<string, unknown> | null;

    if (!response.ok) {
      throw new Error(
        typeof body?.error === 'string'
          ? body.error
          : `CLAREIRA_SARA_HTTP_${response.status}`,
      );
    }

    return {
      ok: body?.ok === true,
      nucleus: typeof body?.nucleus === 'string' ? body.nucleus : undefined,
      capability: typeof body?.capability === 'string' ? body.capability : undefined,
      correlationId: typeof body?.correlationId === 'string' ? body.correlationId : correlation,
      result: body?.result && typeof body.result === 'object'
        ? body.result as Record<string, unknown>
        : undefined,
    };
  }
}
