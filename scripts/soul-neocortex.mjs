import crypto from 'node:crypto';
import { createSuperGPU } from './soul-supergpu.mjs';

const NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'];
const SIGNALS = ['GOAL', 'CONTEXT', 'CAPABILITY', 'RESULT', 'ERROR', 'FEEDBACK'];

function clamp(value, min = 0, max = 1) { return Math.max(min, Math.min(max, Number(value) || 0)); }

export function createNeoCortex({ resolveOwner, forward }) {
  if (typeof resolveOwner !== 'function' || typeof forward !== 'function') throw new Error('NEOCORTEX_DEPENDENCIES_REQUIRED');

  const nodes = new Map();
  const goals = new Map();
  const workingMemory = new Map();
  const signals = new Map();
  const superGPU = createSuperGPU({ resolveOwner, forward, self: 'N01' });

  for (const nucleus of NUCLEI) nodes.set(nucleus, { nucleus, capabilities: [], salience: 1, load: 0, available: true });

  function registerNode(node) {
    if (!node || !NUCLEI.includes(node.nucleus)) throw new Error('INVALID_NEOCORTEX_NODE');
    nodes.set(node.nucleus, {
      ...node,
      capabilities: [...new Set(node.capabilities || [])],
      salience: clamp(node.salience ?? 1),
      load: clamp(node.load ?? 0),
      available: node.available !== false,
    });
  }

  function addGoal(goal) {
    if (!goal?.id?.trim() || !goal?.description?.trim()) throw new Error('INVALID_COGNITIVE_GOAL');
    goals.set(goal.id, { ...goal, priority: clamp(goal.priority ?? 0.5) });
  }

  function remember(item) {
    if (!item?.id?.trim()) throw new Error('INVALID_WORKING_MEMORY_ID');
    workingMemory.set(item.id, { ...item, salience: clamp(item.salience ?? 0.5) });
  }

  function emitSignal(signal) {
    if (!signal?.id?.trim() || !NUCLEI.includes(signal.source) || !SIGNALS.includes(signal.kind)) throw new Error('INVALID_NEURAL_SIGNAL');
    signals.set(signal.id, { ...signal, activation: clamp(signal.activation ?? 1), timestamp: signal.timestamp || Date.now() });
  }

  function route(signal, capability) {
    const candidates = [...nodes.values()].filter((node) => node.available && (!capability || node.capabilities.includes(capability)));
    return candidates.map((node) => {
      const targetBias = signal.target === node.nucleus ? 1 : 0;
      const capabilityMatch = capability && node.capabilities.includes(capability) ? 0.45 : 0;
      const attention = node.salience * 0.35;
      const availability = (1 - node.load) * 0.2;
      return {
        source: signal.source,
        target: node.nucleus,
        weight: clamp(targetBias + capabilityMatch + attention + availability),
        reason: targetBias ? 'explicit-target' : capabilityMatch ? 'capability-match' : 'distributed-attention',
      };
    }).sort((a, b) => b.weight - a.weight);
  }

  function decide(goalId, capability) {
    const goal = goals.get(goalId);
    if (!goal) throw new Error(`GOAL_NOT_FOUND:${goalId}`);
    const signal = {
      id: `goal:${goal.id}:${crypto.randomUUID()}`,
      source: 'N01',
      kind: 'GOAL',
      activation: goal.priority,
      features: goal.requiredCapabilities || [],
      payload: goal.context,
      timestamp: Date.now(),
    };
    emitSignal(signal);
    const requested = capability || goal.requiredCapabilities?.[0];
    const routes = route(signal, requested);
    const resolved = requested ? (() => { try { return superGPU.resolve({ id: crypto.randomUUID(), capability: requested, payload: goal.context }); } catch { return null; } })() : null;
    const best = resolved ? routes.find((item) => item.target === resolved.owner) || routes[0] : routes[0];
    return {
      goalId,
      capability: requested,
      selectedNucleus: best?.target || resolved?.owner,
      routes,
      inhibited: !best && !resolved,
      reason: best?.reason || (resolved ? 'capability-owner' : 'insufficient-confidence-or-availability'),
    };
  }

  function feedback(source, result, activation = 1) {
    emitSignal({ id: `feedback:${crypto.randomUUID()}`, source, kind: 'FEEDBACK', activation, features: [], payload: result, timestamp: Date.now() });
  }

  return {
    registerNode,
    addGoal,
    remember,
    emitSignal,
    decide,
    feedback,
    execute: superGPU.execute,
    executeParallel: superGPU.executeParallel,
    describe() {
      return {
        role: 'neocortex-prefrontal-executive-layer',
        model: 'distributed-neural-graph-with-expert-routing',
        learnedWeights: false,
        nuclei: [...nodes.values()],
        goals: goals.size,
        workingMemory: workingMemory.size,
        signals: signals.size,
        signalKinds: SIGNALS,
        executiveFunctions: ['goal-management', 'working-memory', 'attention-routing', 'capability-selection', 'inhibition', 'parallel-task-scheduling', 'result-integration', 'feedback-propagation'],
        superGPU: superGPU.describe(),
      };
    },
  };
}
