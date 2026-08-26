import { SOUL_NUCLEI, SOUL_MESH_PEERS, type SoulNucleusId } from './SoulMeshTopology';
import { rankPeersForIntent, type SoulPilotIntent } from './SoulPilotRouting';
import { SoulMeshDirectAccess, type SoulChannelProbe } from './SoulMeshDirectAccess';

export type SoulChannelState = 'UNVERIFIED' | 'CONNECTING' | 'CONNECTED' | 'DEGRADED' | 'FAILED';

export interface SoulCockpitChannel {
  source: SoulNucleusId;
  target: SoulNucleusId;
  direction: 'in' | 'out';
  slot: 1 | 2 | 3 | 4 | 5;
  state: SoulChannelState;
  transport?: string;
  lastVerifiedAt?: number;
  error?: string;
}

export interface SoulCockpitDispatch {
  intent: SoulPilotIntent;
  candidates: SoulNucleusId[];
  parallelizable: true;
}

/** Supervisory cockpit state. It observes and dispatches; it is not a CPU scheduler. */
export class SoulPilotCockpit {
  private readonly channels = new Map<string, SoulCockpitChannel>();
  private readonly access = new SoulMeshDirectAccess('COCKPIT');

  constructor() {
    for (const source of SOUL_NUCLEI) {
      SOUL_MESH_PEERS[source].forEach((target, index) => {
        const slot = (index + 1) as 1 | 2 | 3 | 4 | 5;
        this.setChannel({ source, target, direction: 'out', slot, state: 'UNVERIFIED' });
        this.setChannel({ source: target, target: source, direction: 'in', slot, state: 'UNVERIFIED' });
      });
    }
  }

  private key(channel: Pick<SoulCockpitChannel, 'source' | 'target' | 'direction' | 'slot'>): string {
    return `${channel.source}->${channel.target}:${channel.direction}:${channel.slot}`;
  }

  setChannel(channel: SoulCockpitChannel): void {
    this.channels.set(this.key(channel), channel);
  }

  getChannel(source: SoulNucleusId, target: SoulNucleusId, direction: 'in' | 'out', slot: 1 | 2 | 3 | 4 | 5): SoulCockpitChannel | undefined {
    return this.channels.get(this.key({ source, target, direction, slot }));
  }

  dispatch(owner: SoulNucleusId, intents: SoulPilotIntent[]): SoulCockpitDispatch[] {
    return intents.map((intent) => ({ intent, candidates: rankPeersForIntent(owner, intent), parallelizable: true }));
  }

  async verifyAllChannels(): Promise<SoulChannelProbe[]> {
    const results = await this.access.probeAll();
    const now = Date.now();
    for (const result of results) {
      const c = result.channel;
      this.setChannel({
        source: c.source,
        target: c.target,
        direction: c.direction,
        slot: c.slot,
        state: result.reachable ? 'CONNECTED' : result.configured ? 'FAILED' : 'UNVERIFIED',
        transport: 'HTTP',
        lastVerifiedAt: result.reachable ? now : undefined,
        error: result.error,
      });
    }
    return results;
  }

  snapshot(): SoulCockpitChannel[] {
    return [...this.channels.values()];
  }

  summary() {
    const states = this.snapshot().reduce<Record<SoulChannelState, number>>((acc, channel) => {
      acc[channel.state] += 1;
      return acc;
    }, { UNVERIFIED: 0, CONNECTING: 0, CONNECTED: 0, DEGRADED: 0, FAILED: 0 });
    return { total: this.channels.size, ...states };
  }
}
