export type FusionNodeId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';

export interface FusionCapability {
  id: string;
  node: FusionNodeId;
  inputs: readonly string[];
  outputs: readonly string[];
  status: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';
  privacy: number;
  cost: number;
}

export interface FusionResult {
  leftNode: FusionNodeId;
  rightNode: FusionNodeId;
  sharedInputs: string[];
  composedOutputs: string[];
  bridgeCapabilities: string[];
  synergyScore: number;
  viable: boolean;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const intersection = (left: readonly string[], right: readonly string[]): string[] =>
  [...new Set(left)].filter((value) => new Set(right).has(value));

const union = (left: readonly string[], right: readonly string[]): string[] =>
  [...new Set([...left, ...right])];

const outputToInputBridges = (
  left: FusionCapability,
  right: FusionCapability,
): string[] => intersection(left.outputs, right.inputs);

function capabilityQuality(capability: FusionCapability): number {
  if (capability.status === 'UNAVAILABLE') return 0;
  const availability = capability.status === 'AVAILABLE' ? 1 : 0.5;
  return availability * (0.7 + 0.3 * clamp01(capability.privacy)) * (1 - 0.25 * clamp01(capability.cost));
}

/**
 * Calculates pairwise composition without changing either nucleus' ownership.
 * A fusion is useful when one nucleus can consume an output of the other or
 * when both expose a common input that can be jointly orchestrated.
 */
export function evaluateFusion(
  left: FusionCapability,
  right: FusionCapability,
): FusionResult {
  if (left.node === right.node) throw new Error('Fusion requires two distinct nuclei');

  const bridges = outputToInputBridges(left, right);
  const reverseBridges = outputToInputBridges(right, left);
  const sharedInputs = intersection(left.inputs, right.inputs);
  const composedOutputs = union(left.outputs, right.outputs);

  const bridgeScore = Math.min(1, (bridges.length + reverseBridges.length) / 2);
  const sharedScore = sharedInputs.length > 0 ? 0.25 : 0;
  const quality = (capabilityQuality(left) + capabilityQuality(right)) / 2;
  const synergyScore = clamp01(quality * (0.55 * bridgeScore + sharedScore + 0.2));

  return {
    leftNode: left.node,
    rightNode: right.node,
    sharedInputs,
    composedOutputs,
    bridgeCapabilities: [...new Set([...bridges, ...reverseBridges])],
    synergyScore,
    viable: synergyScore > 0 && (bridges.length > 0 || reverseBridges.length > 0 || sharedInputs.length > 0),
  };
}

/**
 * Evaluates all capabilities owned by two distinct nuclei and keeps the
 * highest-value composition for each cross-node capability bridge.
 */
export function evaluatePairFusion(
  leftNode: FusionNodeId,
  leftCapabilities: readonly FusionCapability[],
  rightNode: FusionNodeId,
  rightCapabilities: readonly FusionCapability[],
): FusionResult[] {
  if (leftNode === rightNode) throw new Error('Pair fusion requires two distinct nuclei');

  return leftCapabilities
    .filter((capability) => capability.node === leftNode)
    .flatMap((left) => rightCapabilities
      .filter((capability) => capability.node === rightNode)
      .map((right) => evaluateFusion(left, right)))
    .filter((result) => result.viable)
    .sort((a, b) => b.synergyScore - a.synergyScore);
}

/**
 * Produces the next-level candidate set from two already evaluated pair
 * results. This is deliberately additive: it never mutates or transfers
 * ownership of a capability between nuclei.
 */
export function composeFusionLevels(
  first: readonly FusionResult[],
  second: readonly FusionResult[],
): FusionResult[] {
  const candidates = [...first, ...second];
  return candidates
    .filter((candidate) => candidate.viable)
    .sort((a, b) => b.synergyScore - a.synergyScore)
    .filter((candidate, index, all) =>
      all.findIndex((item) =>
        item.leftNode === candidate.leftNode &&
        item.rightNode === candidate.rightNode &&
        item.bridgeCapabilities.join('|') === candidate.bridgeCapabilities.join('|'),
      ) === index,
    );
}
