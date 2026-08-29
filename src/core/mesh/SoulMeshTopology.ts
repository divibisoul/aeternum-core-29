import type { SoulNucleus } from './SoulMeshProtocol';
import { SOUL_NUCLEI } from './SoulMeshProtocol';

export const N01_PEERS: Exclude<SoulNucleus, 'N01'>[] = SOUL_NUCLEI.filter((nucleus): nucleus is Exclude<SoulNucleus, 'N01'> => nucleus !== 'N01');
export const N01_IN_CHANNELS = N01_PEERS.map(peer => `N01.IN.${peer}`);
export const N01_OUT_CHANNELS = N01_PEERS.map(peer => `N01.OUT.${peer}`);
export const N01_BIDIRECTIONAL_PAIRS = N01_PEERS.map(peer => ({ from: 'N01' as const, to: peer }));

export function isN01Peer(nucleus: SoulNucleus): nucleus is Exclude<SoulNucleus, 'N01'> {
  return nucleus !== 'N01' && N01_PEERS.includes(nucleus as Exclude<SoulNucleus, 'N01'>);
}

export function channelFor(peer: Exclude<SoulNucleus, 'N01'>, direction: 'IN' | 'OUT'): string {
  return `N01.${direction}.${peer}`;
}
