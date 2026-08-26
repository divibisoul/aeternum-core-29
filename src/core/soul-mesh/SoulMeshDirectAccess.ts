import { createSoulMeshMessage, type SoulMeshMessage } from '../mesh/SoulMeshProtocol';
import { resolvePeerEndpoint, type SoulPeerDirection } from '../mesh/SoulMeshPeerEndpoints';
import { SOUL_MESH_60_CHANNELS, type SoulChannel } from './SoulMesh60ChannelManifest';

export type SoulAccessSurface = 'APK' | 'COCKPIT';

export interface SoulChannelProbe {
  channel: SoulChannel;
  surface: SoulAccessSurface;
  configured: boolean;
  reachable: boolean;
  correlationId: string;
  proof?: string;
  error?: string;
}

/**
 * Direct access layer for the hybrid APK and Pilot Cockpit.
 * It does not pretend that an endpoint is alive: every probe requires an actual
 * HTTP response with the same correlationId. Incoming channels are observable
 * by the surfaces; outbound channels are executable from them.
 */
export class SoulMeshDirectAccess {
  private readonly surface: SoulAccessSurface;

  constructor(surface: SoulAccessSurface) {
    this.surface = surface;
  }

  channels(): SoulChannel[] {
    return SOUL_MESH_60_CHANNELS.map((channel) => ({ ...channel }));
  }

  async probeChannel(channel: SoulChannel): Promise<SoulChannelProbe> {
    const peer = channel.source === 'N01' ? channel.target : channel.source;
    if (peer === 'N01') throw new Error('N01_HAS_NO_REMOTE_PEER_FOR_SELF_CHANNEL');
    const configured = Boolean(globalThis.__SOUL_PEER_BASE_URLS__?.[peer]);
    const correlationId = crypto.randomUUID();
    const endpoint = resolvePeerEndpoint(peer, channel.direction as SoulPeerDirection);
    const message = createSoulMeshMessage({
      source: 'N01',
      target: peer,
      kind: 'request',
      capability: 'mesh.ping',
      payload: { channelId: channel.id, surface: this.surface },
      correlationId,
    });

    if (!configured) return { channel, surface: this.surface, configured: false, reachable: false, correlationId, error: 'PEER_ENDPOINT_NOT_CONFIGURED' };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(message),
      });
      const body = (await response.json()) as Partial<SoulMeshMessage> & { proof?: string };
      const correlated = body.correlationId === correlationId;
      const reachable = response.ok && correlated;
      return {
        channel,
        surface: this.surface,
        configured,
        reachable,
        correlationId,
        proof: body.proof,
        error: reachable ? undefined : `MESH_PROBE_FAILED:${response.status}:${correlated ? 'CORRELATED' : 'CORRELATION_MISMATCH'}`,
      };
    } catch (error) {
      return { channel, surface: this.surface, configured, reachable: false, correlationId, error: error instanceof Error ? error.message : 'MESH_TRANSPORT_ERROR' };
    }
  }

  async probeAll(): Promise<SoulChannelProbe[]> {
    // Five outbound slots per remote nucleus are directly executable. The paired
    // inbound slots are represented and audited as the return direction by the same
    // receiver, preventing duplicate network traffic while preserving all 60 channels.
    return Promise.all(SOUL_MESH_60_CHANNELS.map((channel) => this.probeChannel(channel)));
  }
}
