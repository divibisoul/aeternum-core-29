import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';
import { SoulMeshRouter } from './SoulMeshRouter';
import { SoulMeshSupabaseTransport } from './SoulMeshSupabaseTransport';
import type { MeshChannelDiagnostic } from './types';

const REMOTE_NUCLEI = ['N02', 'N03', 'N04', 'N05', 'N06'] as const;
export type N01Peer = typeof REMOTE_NUCLEI[number];

export type FiveChannelDiagnosticOptions = {
  timeoutMs?: number;
  onResult?: (result: MeshChannelDiagnostic) => void;
};

export type FiveChannelDiagnosticReport = {
  local: 'N01';
  checkedAt: number;
  results: MeshChannelDiagnostic[];
  outboundPass: number;
  inboundVerified: number;
  allOutboundPassed: boolean;
  allInboundVerified: boolean;
};

/** Runtime diagnostic for N01 -> N02..N06 using the same Supabase Realtime transport as N01. */
export class SoulMeshFiveChannelDiagnostic {
  constructor(private readonly options: FiveChannelDiagnosticOptions = {}) {}

  async run(): Promise<FiveChannelDiagnosticReport> {
    const transport = new SoulMeshSupabaseTransport();
    const router = new SoulMeshRouter(transport, 'N01', this.options.timeoutMs ?? 3000);
    const results: MeshChannelDiagnostic[] = [];

    try {
      for (const peer of REMOTE_NUCLEI) {
        const startedAt = performance.now();
        try {
          const response = await router.request(peer, 'mesh.echo', { probe: true, source: 'N01', sentAt: Date.now() });
          const requestMs = Math.round(performance.now() - startedAt);
          const validResponse = this.isCorrelatedResponse(response, peer);
          const result: MeshChannelDiagnostic = {
            peer,
            outbound: validResponse ? 'PASS' : 'FAIL',
            inbound: validResponse ? 'PASS' : 'FAIL',
            requestMs,
            ...(validResponse ? {} : { error: 'RESPONSE_CORRELATION_OR_TARGET_INVALID' }),
          };
          results.push(result);
          this.options.onResult?.(result);
        } catch (error) {
          const result: MeshChannelDiagnostic = {
            peer,
            outbound: 'FAIL',
            inbound: 'FAIL',
            requestMs: Math.round(performance.now() - startedAt),
            error: error instanceof Error ? error.message : String(error),
          };
          results.push(result);
          this.options.onResult?.(result);
        }
      }
    } finally {
      router.close();
      await transport.close();
    }

    const outboundPass = results.filter(result => result.outbound === 'PASS').length;
    const inboundVerified = results.filter(result => result.inbound === 'PASS').length;
    return {
      local: 'N01',
      checkedAt: Date.now(),
      results,
      outboundPass,
      inboundVerified,
      allOutboundPassed: results.length === REMOTE_NUCLEI.length && outboundPass === REMOTE_NUCLEI.length,
      allInboundVerified: results.length === REMOTE_NUCLEI.length && inboundVerified === REMOTE_NUCLEI.length,
    };
  }

  private isCorrelatedResponse(message: SoulMeshMessage, peer: SoulNucleus): boolean {
    return message.kind === 'response' && message.source === peer && message.target === 'N01' && Boolean(message.correlationId);
  }
}
