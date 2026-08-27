import type { SoulMeshMessage, SoulNucleus } from './SoulMeshProtocol';
import { SoulMeshHttpTransport } from './SoulMeshHttpTransport';
import { SoulMeshRouter } from './SoulMeshRouter';
import type { MeshChannelDiagnostic } from './types';

const REMOTE_NUCLEI = ['N02', 'N03', 'N04', 'N05', 'N06'] as const;
export type N01Peer = typeof REMOTE_NUCLEI[number];

export type FiveChannelDiagnosticOptions = {
  peers: Partial<Record<N01Peer, string>>;
  timeoutMs?: number;
  retries?: number;
  authToken?: string;
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

/**
 * Runtime diagnostic for N01 -> N02..N06. It never labels an unobserved inbound
 * path as healthy: inbound is VERIFIED only when the peer returns a correlated response.
 */
export class SoulMeshFiveChannelDiagnostic {
  constructor(private readonly options: FiveChannelDiagnosticOptions) {}

  async run(): Promise<FiveChannelDiagnosticReport> {
    const results: MeshChannelDiagnostic[] = [];
    for (const peer of REMOTE_NUCLEI) {
      const endpoint = this.options.peers[peer];
      if (!endpoint) {
        const result: MeshChannelDiagnostic = { peer, outbound: 'SKIPPED', inbound: 'UNVERIFIED', error: 'PEER_ENDPOINT_NOT_CONFIGURED' };
        results.push(result);
        this.options.onResult?.(result);
        continue;
      }

      const transport = new SoulMeshHttpTransport(endpoint, {
        timeoutMs: this.options.timeoutMs ?? 3000,
        retries: this.options.retries ?? 2,
        authToken: this.options.authToken,
      });
      const router = new SoulMeshRouter(transport, 'N01', this.options.timeoutMs ?? 3000);
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
        const result: MeshChannelDiagnostic = { peer, outbound: 'FAIL', inbound: 'FAIL', requestMs: Math.round(performance.now() - startedAt), error: error instanceof Error ? error.message : String(error) };
        results.push(result);
        this.options.onResult?.(result);
      } finally {
        router.close();
      }
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
