export type NucleusId = 'N01'|'N02'|'N03'|'N04'|'N05'|'N06';
export type CapabilityPolicy = { owner: NucleusId; fallback: NucleusId[]; consumers: NucleusId[] };
export const SOUL_CAPABILITY_OWNERSHIP: Record<string, CapabilityPolicy> = {
  'android.': { owner:'N01', fallback:['N06'], consumers:['N02','N03','N04','N05','N06'] },
  'conversation.': { owner:'N02', fallback:['N04','N05'], consumers:['N01','N03','N04','N05','N06'] },
  'perception.': { owner:'N03', fallback:['N01'], consumers:['N01','N02','N04','N05','N06'] },
  'document.': { owner:'N04', fallback:['N06'], consumers:['N01','N02','N03','N05','N06'] },
  'inference.': { owner:'N05', fallback:['N02','N06'], consumers:['N01','N02','N03','N04','N06'] },
  'cognitive.': { owner:'N06', fallback:['N05','N02'], consumers:['N01','N02','N03','N04','N05'] },
};
export function resolveCapabilityOwner(capability: string): CapabilityPolicy | undefined {
  return Object.entries(SOUL_CAPABILITY_OWNERSHIP).find(([prefix]) => capability.startsWith(prefix))?.[1];
}
