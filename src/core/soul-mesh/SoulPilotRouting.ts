import { SOUL_AFFINITY, SOUL_MESH_PEERS, type SoulNucleusId } from './SoulMeshTopology';

export type SoulPilotIntent = 'runtime' | 'perception' | 'conversation' | 'tools' | 'orchestration' | 'cognition';

const intentGroups: Record<SoulPilotIntent, string> = {
  runtime: 'runtime-foundation',
  perception: 'perception-context',
  conversation: 'conversation-interaction',
  tools: 'tools-artifacts',
  orchestration: 'orchestration-execution',
  cognition: 'cognition-governance',
};

export function rankPeersForIntent(owner: SoulNucleusId, intent: SoulPilotIntent): SoulNucleusId[] {
  const desired = intentGroups[intent];
  return [...SOUL_MESH_PEERS[owner]].sort((a, b) => {
    const aMatch = SOUL_AFFINITY[a].group === desired ? 0 : 1;
    const bMatch = SOUL_AFFINITY[b].group === desired ? 0 : 1;
    return aMatch - bMatch || SOUL_AFFINITY[a].priority - SOUL_AFFINITY[b].priority;
  });
}

/**
 * The Pilot chooses where work is best suited; it does not execute the work
 * itself and does not serialize the GPU fabric into a CPU-like pipeline.
 */
export function buildDispatchPlan(owner: SoulNucleusId, intents: SoulPilotIntent[]) {
  return intents.map((intent) => ({ intent, candidates: rankPeersForIntent(owner, intent) }));
}
