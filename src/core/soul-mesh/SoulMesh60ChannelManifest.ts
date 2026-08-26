import { SOUL_MESH_PEERS, type SoulNucleusId } from './SoulMeshTopology';

export type SoulChannelDirection = 'in' | 'out';
export type SoulChannel = {
  id: string;
  source: SoulNucleusId;
  target: SoulNucleusId;
  direction: SoulChannelDirection;
  slot: 1 | 2 | 3 | 4 | 5;
};

export const SOUL_MESH_60_CHANNELS: SoulChannel[] = Object.entries(SOUL_MESH_PEERS).flatMap(([owner, peers]) =>
  (peers as readonly SoulNucleusId[]).flatMap((peer, index) => {
    const slot = (index + 1) as SoulChannel['slot'];
    return [
      { id: `${owner}.out.${slot}.${peer}`, source: owner as SoulNucleusId, target: peer, direction: 'out' as const, slot },
      { id: `${owner}.in.${slot}.${peer}`, source: peer, target: owner as SoulNucleusId, direction: 'in' as const, slot },
    ];
  }),
);

if (SOUL_MESH_60_CHANNELS.length !== 60) {
  throw new Error(`SOUL_MESH_CHANNEL_COUNT_INVALID:${SOUL_MESH_60_CHANNELS.length}`);
}

export function channelsFor(owner: SoulNucleusId) {
  return SOUL_MESH_60_CHANNELS.filter((channel) => channel.id.startsWith(`${owner}.`));
}
