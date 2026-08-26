export const SOUL_NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'] as const;
export type SoulNucleusId = (typeof SOUL_NUCLEI)[number];

export const HYBRID_TRANSPORTS = [
  'IN_PROCESS',
  'WEBVIEW_BRIDGE',
  'LOOPBACK_HTTP',
  'HTTP',
  'REALTIME',
] as const;
export type HybridTransport = (typeof HYBRID_TRANSPORTS)[number];

export type ChannelDirection = 'IN' | 'OUT';
export type ChannelProof = 'UNVERIFIED' | 'NEGOTIATING' | 'CONNECTED' | 'EXECUTED' | 'VERIFIED';

export interface SoulChannel {
  id: string;
  source: SoulNucleusId;
  target: SoulNucleusId;
  direction: ChannelDirection;
  transports: readonly HybridTransport[];
  synergy: string;
  proof: ChannelProof;
}

export const NUCLEUS_AFFINITY: Record<SoulNucleusId, readonly string[]> = {
  N01: ['runtime', 'android', 'gateway', 'user-access', 'cockpit'],
  N02: ['conversation', 'dialogue', 'interaction', 'streaming'],
  N03: ['perception', 'multimodal', 'audio', 'context'],
  N04: ['tools', 'documents', 'artifacts', 'execution'],
  N05: ['orchestration', 'dispatch', 'pilot', 'parallel-coordination'],
  N06: ['cognition', 'synthesis', 'reasoning', 'governance'],
};

const PEER_IDS = SOUL_NUCLEI;

function makeChannel(source: SoulNucleusId, target: SoulNucleusId, direction: ChannelDirection): SoulChannel {
  return {
    id: `${source}.${direction}.${target}`,
    source,
    target,
    direction,
    transports: HYBRID_TRANSPORTS,
    synergy: synergyFor(source, target),
    proof: 'UNVERIFIED',
  };
}

function synergyFor(source: SoulNucleusId, target: SoulNucleusId): string {
  const pair = [source, target].sort().join('-');
  const synergies: Record<string, string> = {
    'N01-N02': 'user-gateway ↔ conversation',
    'N01-N03': 'user-gateway ↔ perception',
    'N01-N04': 'user-gateway ↔ tools',
    'N01-N05': 'user-gateway ↔ orchestration',
    'N01-N06': 'user-gateway ↔ cognition',
    'N02-N03': 'conversation ↔ multimodal context',
    'N02-N04': 'conversation ↔ tool/document execution',
    'N02-N05': 'conversation ↔ dispatch',
    'N02-N06': 'conversation ↔ cognitive synthesis',
    'N03-N04': 'perception ↔ tool/artifact execution',
    'N03-N05': 'perception ↔ orchestration',
    'N03-N06': 'perception ↔ cognition',
    'N04-N05': 'tools ↔ orchestration',
    'N04-N06': 'artifacts ↔ cognition',
    'N05-N06': 'orchestration ↔ cognition/governance',
  };
  return synergies[pair] ?? `peer synergy ${pair}`;
}

export const SOUL_CHANNELS: readonly SoulChannel[] = SOUL_NUCLEI.flatMap((source) =>
  PEER_IDS.filter((target) => target !== source).flatMap((target) => [
    makeChannel(source, target, 'OUT'),
    makeChannel(target, source, 'IN'),
  ]),
);

export function assertSoulFabricTopology(): void {
  const out = SOUL_CHANNELS.filter((channel) => channel.direction === 'OUT');
  const input = SOUL_CHANNELS.filter((channel) => channel.direction === 'IN');

  if (out.length !== 30 || input.length !== 30 || SOUL_CHANNELS.length !== 60) {
    throw new Error(`Invalid Soul fabric topology: expected 30 OUT + 30 IN, got ${out.length} OUT + ${input.length} IN`);
  }

  for (const nucleus of SOUL_NUCLEI) {
    const nucleusOut = out.filter((channel) => channel.source === nucleus);
    const nucleusIn = input.filter((channel) => channel.target === nucleus);
    if (nucleusOut.length !== 5 || nucleusIn.length !== 5) {
      throw new Error(`Invalid ${nucleus} topology: expected 5 OUT + 5 IN`);
    }
  }
}

export function isVerifiedChannel(channel: SoulChannel): boolean {
  return channel.proof === 'VERIFIED';
}

// A declared route, registry entry, or health response is deliberately insufficient.
// Runtime integration must advance proof only after a real correlated request/response.
export function canAdvanceProof(current: ChannelProof, evidence: {
  transportNegotiated: boolean;
  destinationReached: boolean;
  handlerExecuted: boolean;
  correlatedResponse: boolean;
}): ChannelProof {
  if (current === 'VERIFIED') return current;
  if (!evidence.transportNegotiated) return current;
  if (!evidence.destinationReached) return 'NEGOTIATING';
  if (!evidence.handlerExecuted) return 'CONNECTED';
  if (!evidence.correlatedResponse) return 'EXECUTED';
  return 'VERIFIED';
}

assertSoulFabricTopology();
