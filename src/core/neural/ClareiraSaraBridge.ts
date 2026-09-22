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
  readonly version = '1.1.0';

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

  async auditLatestState(correlation?: string): Promise<ClareiraSaraResponse> {
    return this.request(
      '/audit',
      {},
      correlation ?? correlationId('clareira-audit'),
      'GET',
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

  async pullAndApplyVagalCommands(
    apply: (
      nodeId: string,
      command: 'calm' | 'turbo' | 'reduce_thermal' | 'shutdown' | 'resume',
      payload: Record<string, unknown>
    ) => boolean,
    limit = 32,
  ): Promise<{ received: number; executed: number; failed: number }> {
    const correlation = correlationId('clareira-vagal-poll');
    const response = await fetch(
      this.gatewayBaseUrl.replace(/\/$/, '') + `/vagus/pending?limit=${Math.max(1, Math.min(32, limit))}`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          'x-correlation-id': correlation,
        },
        cache: 'no-store',
      },
    );
    if (!response.ok) {
      throw new Error(`CLAREIRA_SARA_VAGAL_PULL_${response.status}`);
    }
    const body = await response.json() as { commands?: Array<Record<string, unknown>> };
    const commands = Array.isArray(body.commands) ? body.commands : [];
    let executed = 0;
    let failed = 0;
    for (const item of commands) {
      const eventId = typeof item.event_id === 'string' ? item.event_id : '';
      const envelope = item.payload && typeof item.payload === 'object'
        ? item.payload as Record<string, unknown>
        : {};
      const nodeId = typeof envelope.node_id === 'string' ? envelope.node_id : '';
      const commandEnvelope = envelope.payload && typeof envelope.payload === 'object'
        ? envelope.payload as Record<string, unknown>
        : {};
      const rawCommand = typeof envelope.command === 'string' ? envelope.command : '';
      const validCommands = new Set(['calm', 'turbo', 'reduce_thermal', 'shutdown', 'resume']);
      if (!nodeId || !eventId || !validCommands.has(rawCommand)) {
        failed += 1;
        continue;
      }
      let ok = false;
      try {
        ok = apply(
          nodeId,
          rawCommand as 'calm' | 'turbo' | 'reduce_thermal' | 'shutdown' | 'resume',
          commandEnvelope as Record<string, unknown>,
        );
      } catch {
        ok = false;
      }
      if (ok) executed += 1;
      else failed += 1;

      await this.ackVagalCommand(
        eventId,
        ok,
        ok ? 'APPLIED_IN_SOUL_RUNTIME' : 'APPLICATION_FAILED',
        `${correlation}-${eventId}`,
      );
    }
    return { received: commands.length, executed, failed };
  }

  private async ackVagalCommand(
    eventId: string,
    executed: boolean,
    executionStatus: string,
    correlation: string,
  ): Promise<void> {
    const response = await fetch(
      this.gatewayBaseUrl.replace(/\/$/, '') + '/vagus/ack',
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-correlation-id': correlation,
        },
        body: JSON.stringify({
          event_id: eventId,
          executed,
          execution_status: executionStatus,
        }),
      },
    );
    if (!response.ok) throw new Error(`CLAREIRA_SARA_VAGAL_ACK_${response.status}`);
  }

  private async request(
    path: string,
    payload: Record<string, unknown> | ClareiraSnapshot,
    correlation: string,
    method: 'POST' | 'GET' = 'POST',
  ): Promise<ClareiraSaraResponse> {
    const response = await fetch(this.gatewayBaseUrl.replace(/\/$/, '') + path, {
      method,
      headers: {
        ...(method === 'POST' ? { 'content-type': 'application/json' } : {}),
        'x-correlation-id': correlation,
      },
      ...(method === 'POST' ? { body: JSON.stringify(payload) } : {}),
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
