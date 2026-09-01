import { buildCapabilityLinks, type MeshCapabilityLink } from './SoulMeshCapabilityGraph.ts';
import { SoulMeshPeerResilience } from './SoulMeshPeerResilience.ts';
import type { TransportKind } from './HybridTransportRegistry.ts';

export interface OrchestrationStep { id: string; capability: string; target: string; dependsOn?: readonly string[]; }
export interface OrchestrationPlan { steps: readonly OrchestrationStep[]; }
export interface OrchestrationPolicy { maxSteps: number; allowedTargets?: readonly string[]; }

/** Lightweight planner that consumes the existing Mesh capability graph and resilience state. */
export class SoulMeshOrchestrator {
  private readonly resilience: SoulMeshPeerResilience;
  private readonly policy: OrchestrationPolicy;
  constructor(policy: Partial<OrchestrationPolicy> = {}, resilience = new SoulMeshPeerResilience()) { this.policy = { maxSteps: 16, ...policy }; this.resilience = resilience; }
  plan(
    localTransports: readonly TransportKind[],
    capabilities: readonly { nucleus: string; capability: string; availability: 'executable' | 'declared' | 'unavailable'; transports: readonly TransportKind[] }[],
    requested: readonly { capability: string; target?: string; id?: string; dependsOn?: readonly string[] }[],
  ): OrchestrationPlan {
    if (requested.length > this.policy.maxSteps) throw new Error('ORCHESTRATION_STEP_LIMIT_EXCEEDED');
    const links = buildCapabilityLinks(localTransports, capabilities);
    const steps = requested.map((request, index) => {
      const link: MeshCapabilityLink | undefined = links.find((candidate) => candidate.capability === request.capability && (!request.target || candidate.target === request.target));
      if (!link) throw new Error(`CAPABILITY_ROUTE_UNAVAILABLE:${request.capability}`);
      if (this.policy.allowedTargets && !this.policy.allowedTargets.includes(link.target)) throw new Error(`ORCHESTRATION_TARGET_NOT_ALLOWED:${link.target}`);
      if (!this.resilience.canRoute(link.target)) throw new Error(`PEER_NOT_ROUTABLE:${link.target}`);
      return { id: request.id ?? `step-${index + 1}`, capability: request.capability, target: link.target, ...(request.dependsOn ? { dependsOn: request.dependsOn } : {}) } satisfies OrchestrationStep;
    });
    const ids = new Set(steps.map((step) => step.id));
    for (const step of steps) for (const dependency of step.dependsOn ?? []) if (!ids.has(dependency)) throw new Error(`ORCHESTRATION_UNKNOWN_DEPENDENCY:${dependency}`);
    return { steps };
  }
}
