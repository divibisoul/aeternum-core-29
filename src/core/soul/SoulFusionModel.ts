export type FusionNodeId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';

export interface FusionCapability {
  id: string;
  node: FusionNodeId;
  inputs: readonly string[];
  outputs: readonly string[];
  status: 'AVAILABLE' | 'DEGRADED' | 'UNAVAILABLE';
  privacy: number;
  cost: number;
  agents?: readonly string[];
  tools?: readonly string[];
  functions?: readonly string[];
  contexts?: readonly string[];
}

export interface FusionResult {
  leftNode: FusionNodeId;
  rightNode: FusionNodeId;
  sharedInputs: string[];
  composedOutputs: string[];
  bridgeCapabilities: string[];
  synergyScore: number;
  viable: boolean;
  emergentCapabilities?: string[];
  participatingAgents?: string[];
  participatingTools?: string[];
  participatingFunctions?: string[];
}

export interface CompositeFusionResult {
  nodes: FusionNodeId[];
  sourcePairs: FusionResult[][];
  bridgeCapabilities: string[];
  emergentCapabilities: string[];
  participatingAgents: string[];
  participatingTools: string[];
  participatingFunctions: string[];
  synergyScore: number;
  viable: boolean;
}

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

const unique = (values: readonly string[]): string[] => [...new Set(values)];

const intersection = (left: readonly string[], right: readonly string[]): string[] => {
  const rightSet = new Set(right);
  return unique(left).filter((value) => rightSet.has(value));
};

const union = (left: readonly string[], right: readonly string[]): string[] => unique([...left, ...right]);

const outputToInputBridges = (
  left: FusionCapability,
  right: FusionCapability,
): string[] => intersection(left.outputs, right.inputs);

function capabilityQuality(capability: FusionCapability): number {
  if (capability.status === 'UNAVAILABLE') return 0;
  const availability = capability.status === 'AVAILABLE' ? 1 : 0.5;
  return availability * (0.7 + 0.3 * clamp01(capability.privacy)) * (1 - 0.25 * clamp01(capability.cost));
}

function compositionNames(left: FusionCapability, right: FusionCapability): string[] {
  const names: string[] = [];
  if (left.functions?.length && right.functions?.length) names.push(`${left.id}+${right.id}:composed-function`);
  if (left.tools?.length && right.tools?.length) names.push(`${left.id}+${right.id}:composed-toolchain`);
  if (left.agents?.length && right.agents?.length) names.push(`${left.id}+${right.id}:agent-team`);
  if (left.contexts?.length && right.contexts?.length) names.push(`${left.id}+${right.id}:context-aware-operation`);
  if (left.outputs.some((output) => right.inputs.includes(output)) && right.outputs.some((output) => left.inputs.includes(output))) {
    names.push(`${left.id}+${right.id}:bidirectional-workflow`);
  }
  return unique(names);
}

export function evaluateFusion(
  left: FusionCapability,
  right: FusionCapability,
): FusionResult {
  if (left.node === right.node) throw new Error('Fusion requires two distinct nuclei');

  const bridges = outputToInputBridges(left, right);
  const reverseBridges = outputToInputBridges(right, left);
  const sharedInputs = intersection(left.inputs, right.inputs);
  const composedOutputs = union(left.outputs, right.outputs);
  const agents = intersection(left.agents ?? [], right.agents ?? []);
  const tools = intersection(left.tools ?? [], right.tools ?? []);
  const functions = intersection(left.functions ?? [], right.functions ?? []);
  const emergentCapabilities = compositionNames(left, right);

  const bridgeScore = Math.min(1, (bridges.length + reverseBridges.length) / 2);
  const sharedScore = sharedInputs.length > 0 ? 0.2 : 0;
  const collaborationScore = Math.min(1, (agents.length + tools.length + functions.length) / 3) * 0.2;
  const emergenceScore = emergentCapabilities.length > 0 ? 0.15 : 0;
  const quality = (capabilityQuality(left) + capabilityQuality(right)) / 2;
  const synergyScore = clamp01(quality * (0.45 * bridgeScore + sharedScore + collaborationScore + emergenceScore + 0.2));

  return {
    leftNode: left.node,
    rightNode: right.node,
    sharedInputs,
    composedOutputs,
    bridgeCapabilities: unique([...bridges, ...reverseBridges]),
    synergyScore,
    viable: synergyScore > 0 && (
      bridges.length > 0 || reverseBridges.length > 0 || sharedInputs.length > 0 || emergentCapabilities.length > 0
    ),
    emergentCapabilities,
    participatingAgents: agents,
    participatingTools: tools,
    participatingFunctions: functions,
  };
}

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

export function composeSimultaneousPairs(
  firstPair: readonly FusionResult[],
  secondPair: readonly FusionResult[],
): CompositeFusionResult | null {
  if (!firstPair.length || !secondPair.length) return null;

  const viableFirst = firstPair.filter((result) => result.viable);
  const viableSecond = secondPair.filter((result) => result.viable);
  if (!viableFirst.length || !viableSecond.length) return null;

  const bridgeCapabilities = unique([
    ...viableFirst.flatMap((result) => result.bridgeCapabilities),
    ...viableSecond.flatMap((result) => result.bridgeCapabilities),
  ]);
  const emergentCapabilities = unique([
    ...viableFirst.flatMap((result) => result.emergentCapabilities ?? []),
    ...viableSecond.flatMap((result) => result.emergentCapabilities ?? []),
  ]);
  const participatingAgents = unique([
    ...viableFirst.flatMap((result) => result.participatingAgents ?? []),
    ...viableSecond.flatMap((result) => result.participatingAgents ?? []),
  ]);
  const participatingTools = unique([
    ...viableFirst.flatMap((result) => result.participatingTools ?? []),
    ...viableSecond.flatMap((result) => result.participatingTools ?? []),
  ]);
  const participatingFunctions = unique([
    ...viableFirst.flatMap((result) => result.participatingFunctions ?? []),
    ...viableSecond.flatMap((result) => result.participatingFunctions ?? []),
  ]);

  const pairScore = (
    viableFirst.reduce((sum, result) => sum + result.synergyScore, 0) / viableFirst.length +
    viableSecond.reduce((sum, result) => sum + result.synergyScore, 0) / viableSecond.length
  ) / 2;
  const crossComposition = clamp01((bridgeCapabilities.length + emergentCapabilities.length + participatingFunctions.length) / 6);
  const synergyScore = clamp01(pairScore * (0.65 + 0.35 * crossComposition));
  const nodes = unique([...viableFirst, ...viableSecond].flatMap((result) => [result.leftNode, result.rightNode])) as FusionNodeId[];

  return {
    nodes,
    sourcePairs: [viableFirst, viableSecond],
    bridgeCapabilities,
    emergentCapabilities,
    participatingAgents,
    participatingTools,
    participatingFunctions,
    synergyScore,
    viable: nodes.length >= 4 && synergyScore > 0,
  };
}

export function composeFourNucleusFusion(
  firstPair: readonly FusionResult[],
  secondPair: readonly FusionResult[],
): CompositeFusionResult | null {
  const composite = composeSimultaneousPairs(firstPair, secondPair);
  if (!composite || composite.nodes.length < 4) return null;
  return composite;
}

export function composeSixNucleusFusion(
  firstFour: CompositeFusionResult,
  secondPair: readonly FusionResult[],
): CompositeFusionResult | null {
  if (!firstFour.viable || !secondPair.length) return null;
  const viableSecond = secondPair.filter((result) => result.viable);
  if (!viableSecond.length) return null;

  const secondScore = viableSecond.reduce((sum, result) => sum + result.synergyScore, 0) / viableSecond.length;
  const bridgeCapabilities = unique([...firstFour.bridgeCapabilities, ...viableSecond.flatMap((result) => result.bridgeCapabilities)]);
  const emergentCapabilities = unique([...firstFour.emergentCapabilities, ...viableSecond.flatMap((result) => result.emergentCapabilities ?? [])]);
  const participatingAgents = unique([...firstFour.participatingAgents, ...viableSecond.flatMap((result) => result.participatingAgents ?? [])]);
  const participatingTools = unique([...firstFour.participatingTools, ...viableSecond.flatMap((result) => result.participatingTools ?? [])]);
  const participatingFunctions = unique([...firstFour.participatingFunctions, ...viableSecond.flatMap((result) => result.participatingFunctions ?? [])]);
  const nodes = unique([...firstFour.nodes, ...viableSecond.flatMap((result) => [result.leftNode, result.rightNode])]) as FusionNodeId[];
  const crossComposition = clamp01((bridgeCapabilities.length + emergentCapabilities.length + participatingFunctions.length) / 10);
  const synergyScore = clamp01(((firstFour.synergyScore + secondScore) / 2) * (0.65 + 0.35 * crossComposition));

  return {
    nodes,
    sourcePairs: [...firstFour.sourcePairs, viableSecond],
    bridgeCapabilities,
    emergentCapabilities,
    participatingAgents,
    participatingTools,
    participatingFunctions,
    synergyScore,
    viable: nodes.length === 6 && synergyScore > 0,
  };
}
