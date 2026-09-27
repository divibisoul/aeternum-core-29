export { neuralForgeModule, NeuralForgeModule, neuralForgeModule as forge } from "./NeuralForgeModule";
export { NeuralForgeUI } from "./NeuralForgeUI";
export { screRefactorModule, SCRERefactorModule } from "./SCRERefactorModule";
export { codeGenesisModule, CodeGenesisModule } from "./CodeGenesisModule";
export { blueprintModule, BlueprintModule } from "./BlueprintModule";

/**
 * Federated M7 inventory.
 * N06 and N03 host additional M7 adapters in their own repositories; SARA/N07
 * remains the authoritative regeneration/governance layer.
 */
export const AETERNUM_EVOLUTION_NETWORK = Object.freeze([
  { id: "M7.neural-forge", owner: "N01", authority: "N07_SARA" },
  { id: "M7.scre-refactor", owner: "N01", authority: "N07_SARA" },
  { id: "M7.code-genesis", owner: "N01", authority: "N07_SARA" },
  { id: "M7.blueprint", owner: "N01", authority: "N07_SARA" },
  { id: "M7.ecas-synthesis", owner: "N06", authority: "N07_SARA" },
  { id: "M7.evolution-cycle", owner: "N06", authority: "N07_SARA" },
  { id: "M7.csa", owner: "N06", authority: "N07_SARA" },
  { id: "M7.asc", owner: "N06", authority: "N07_SARA" },
  { id: "M7.palcore-audit", owner: "N03", authority: "N07_SARA" },
] as const);
