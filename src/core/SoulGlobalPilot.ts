import { dispatchFromSoulGateway, type SoulGatewayResult } from './SoulUniversalGateway';
import type { NucleusId } from './SoulMeshServiceDiscovery';

const affinity: Record<string, NucleusId> = {
  perception: 'N03', multimodal: 'N03', conversation: 'N02', interaction: 'N02',
  tools: 'N04', documents: 'N04', orchestration: 'N05', dispatch: 'N05',
  reasoning: 'N06', planning: 'N06', synthesis: 'N06', governance: 'N06',
};

export type SoulPilotTask = { capability: string; payload: unknown; target?: NucleusId; affinity?: string };

/** Global Pilot: chooses by functional affinity and permits parallel dispatch. */
export class SoulGlobalPilot {
  async dispatch(task: SoulPilotTask): Promise<SoulGatewayResult> {
    const target = task.target ?? (task.affinity ? affinity[task.affinity] : undefined);
    if (!target) throw new Error(`SOUL_PILOT_NO_OWNER:${task.capability}`);
    return dispatchFromSoulGateway(target, task.capability, task.payload);
  }

  async dispatchParallel(tasks: readonly SoulPilotTask[]): Promise<PromiseSettledResult<SoulGatewayResult>[]> {
    return Promise.allSettled(tasks.map((task) => this.dispatch(task)));
  }
}

export const soulGlobalPilot = new SoulGlobalPilot();
