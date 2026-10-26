import type { N01Agent } from '../core/mesh/N01AgentContract';
import type { SoulMeshMessage } from '../core/mesh/SoulMeshProtocol';
import { NeoCortexPrefrontal } from './NeoCortexPrefrontal';
import { SoulNeuralGraph } from './SoulNeuralGraph';
import { createDefaultSuperGPU } from './SoulSuperGPU';

export const N01_PREFRONTAL_OPTIMIZER_AGENT_ID = 'N01.neocortex-prefrontal-optimizer';
export const N01_PREFRONTAL_OPTIMIZE_CAPABILITY = 'neural.prefrontal.optimize@1.0.0';

type OptimizationRequest = {
  goalId?: unknown;
  description?: unknown;
  weakPoint?: unknown;
  priority?: unknown;
  context?: unknown;
};

type OptimizationAction = { id: string; action: string; reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function proposeActions(weakPoint: string): OptimizationAction[] {
  const subject = weakPoint.toLowerCase();
  const actions: OptimizationAction[] = [];
  if (/mesh|trace|correlation|transport|retry|idempot/i.test(subject)) {
    actions.push(
      { id: 'preserve-correlation', action: 'propagate root and child trace links', reason: 'make cross-nucleus causality auditable' },
      { id: 'enforce-idempotency', action: 'reject duplicate side-effecting operations', reason: 'prevent retries from corrupting state' },
      { id: 'verify-contract', action: 'validate message version, capability and response correlation', reason: 'fail closed at protocol boundaries' },
    );
  }
  if (/prefrontal|cortex|neural|reason|process|cognitive/i.test(subject)) {
    actions.push(
      { id: 'executive-admission', action: 'route work through capability admission before execution', reason: 'keep planning separate from execution authority' },
      { id: 'inhibit-uncertain-work', action: 'abstain when evidence or route confidence is insufficient', reason: 'avoid converting unknown state into asserted success' },
      { id: 'learn-from-outcome', action: 'record success, failure and measured latency as feedback', reason: 'improve future routing from real results' },
    );
  }
  if (/agent|multi.?agent|concurr|parallel|queue/i.test(subject)) {
    actions.push(
      { id: 'bound-agent-permissions', action: 'use explicit capability allowlists per agent', reason: 'limit blast radius and prevent privilege expansion' },
      { id: 'isolate-failure', action: 'apply bounded concurrency, deadlines and failure containment', reason: 'prevent one stalled agent from blocking the whole runtime' },
      { id: 'correlate-handoffs', action: 'preserve correlation across handoffs and record each child trace', reason: 'make parallel work reconcilable' },
    );
  }
  if (/ci|workflow|runner|build|deploy/i.test(subject)) {
    actions.push(
      { id: 'limit-workflow-fanout', action: 'use concurrency groups and cancel superseded runs', reason: 'reduce duplicate execution and runner pressure' },
      { id: 'bound-runtime', action: 'set job timeouts and explicit failure exits', reason: 'avoid hanging pipelines and false-green outcomes' },
      { id: 'gate-on-evidence', action: 'require the current commit SHA to pass the required checks', reason: 'avoid crediting a stale run to newer code' },
    );
  }
  if (actions.length === 0) {
    actions.push(
      { id: 'measure-before-change', action: 'capture a baseline and identify the failing boundary', reason: 'choose an optimization from evidence instead of assumption' },
      { id: 'preserve-state', action: 'make the change additive and keep rollback evidence', reason: 'avoid destructive repair of shared system state' },
      { id: 'verify-after-change', action: 'run a focused regression test against the changed contract', reason: 'prove the repair without inferring success' },
    );
  }
  return actions;
}

/** Executable deterministic planner; not represented as a generative model or hardware GPU. */
export function createN01PrefrontalOptimizerAgent(): N01Agent {
  const graph = new SoulNeuralGraph();
  graph.registerNode({
    nucleus: 'N01',
    capabilities: [N01_PREFRONTAL_OPTIMIZE_CAPABILITY],
    salience: 0.95,
    load: 0,
    available: true,
  });

  const superGPU = createDefaultSuperGPU([{
    nucleus: 'N01',
    capabilities: [N01_PREFRONTAL_OPTIMIZE_CAPABILITY],
    backends: ['IN_PROCESS'],
    capacity: 1,
    available: true,
  }]);
  superGPU.registerExecutor('IN_PROCESS', async (task) => {
    const payload = isRecord(task.payload) ? task.payload : {};
    const weakPoint = typeof payload.weakPoint === 'string' ? payload.weakPoint.slice(0, 512) : '';
    return {
      mode: 'rule-based-executive-optimization',
      goalId: String(payload.goalId ?? ''),
      weakPoint,
      actions: proposeActions(weakPoint),
      guardrails: {
        additiveOnly: true,
        requiresEvidenceForSuccess: true,
        failClosedOnUnknownCapability: true,
        rootCorrelationPreserved: true,
        parentTraceRecorded: true,
      },
    };
  });

  const cortex = new NeoCortexPrefrontal(graph, superGPU);
  cortex.registerAgent({
    id: N01_PREFRONTAL_OPTIMIZER_AGENT_ID,
    nucleus: 'N01',
    capabilities: [N01_PREFRONTAL_OPTIMIZE_CAPABILITY],
    tools: ['SoulNeuralGraph', 'SoulCognitiveFabric', 'SoulSuperGPU:IN_PROCESS'],
    reliability: 0.95,
    latencyMs: 0,
    available: true,
    version: '1.0.0',
  });

  return {
    id: N01_PREFRONTAL_OPTIMIZER_AGENT_ID,
    name: 'N01 NeoCortex Prefrontal Optimizer',
    capabilities: [N01_PREFRONTAL_OPTIMIZE_CAPABILITY],
    execute: async (message: SoulMeshMessage) => {
      if (message.capability !== N01_PREFRONTAL_OPTIMIZE_CAPABILITY) {
        throw new Error('N01_PREFRONTAL_CAPABILITY_MISMATCH');
      }
      if (!isRecord(message.payload)) throw new Error('N01_PREFRONTAL_REQUEST_OBJECT_REQUIRED');
      const input = message.payload as OptimizationRequest;
      const description = typeof input.description === 'string' ? input.description.trim() : '';
      const weakPoint = typeof input.weakPoint === 'string' ? input.weakPoint.trim() : description;
      if (!description || description.length > 4000) throw new Error('N01_PREFRONTAL_DESCRIPTION_REQUIRED_OR_TOO_LARGE');
      if (weakPoint.length > 512) throw new Error('N01_PREFRONTAL_WEAK_POINT_TOO_LARGE');
      const priority = typeof input.priority === 'number' && Number.isFinite(input.priority)
        ? Math.max(0, Math.min(1, input.priority))
        : 0.75;
      const goalId = typeof input.goalId === 'string' && input.goalId.trim()
        ? input.goalId.trim().slice(0, 128)
        : `pfc:${message.id}`;
      const context = input.context ?? { weakPoint, requestId: message.id };
      const traceId = message.meta?.traceId ?? message.correlationId;

      cortex.addGoal({ id: goalId, description, priority, requiredCapabilities: [N01_PREFRONTAL_OPTIMIZE_CAPABILITY], context });
      cortex.remember({
        id: `request:${message.id}`,
        value: { description, weakPoint, correlationId: message.correlationId, traceId },
        salience: priority,
        source: 'N01',
      });

      const decision = cortex.decide(goalId, N01_PREFRONTAL_OPTIMIZE_CAPABILITY);
      if (decision.inhibited || decision.selectedNucleus !== 'N01') {
        return {
          status: 'inhibited',
          agentId: N01_PREFRONTAL_OPTIMIZER_AGENT_ID,
          goalId,
          traceId,
          correlationId: message.correlationId,
          decision,
          reason: decision.reason,
        };
      }

      const results = await cortex.execute([{
        id: `prefrontal:${message.id}`,
        capability: N01_PREFRONTAL_OPTIMIZE_CAPABILITY,
        payload: { goalId, weakPoint, description, correlationId: message.correlationId },
        preferredNucleus: 'N01',
      }]);
      const result = results[0];
      if (!result || !result.success) throw new Error(`N01_PREFRONTAL_EXECUTION_FAILED:${result?.error ?? 'NO_RESULT'}`);
      return {
        status: 'completed',
        agentId: N01_PREFRONTAL_OPTIMIZER_AGENT_ID,
        goalId,
        traceId,
        correlationId: message.correlationId,
        decision,
        optimization: result.output,
        execution: {
          backend: result.backend,
          nucleus: result.nucleus,
          latencyMs: result.finishedAt - result.startedAt,
          measuredAt: result.finishedAt,
        },
        cortex: cortex.describe(),
      };
    },
  };
}
