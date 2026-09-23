import type { AeternumModuleDescriptor } from "./AeternumTypes";

export const AETERNUM_8_MODULES: readonly AeternumModuleDescriptor[] = [
  {
    id: "M1_CORE",
    name: "Núcleo Central",
    owner: "N01",
    state: "implemented",
    capabilities: ["event-bus", "state-store", "registry", "neural-addressing"],
    dependencies: [],
    evidence: [
      "src/core/EventBus.ts (runtime event authority)",
      "lib/aeternum/EventBus.ts (typed AETERNUM facade over the core bus)",
      "lib/aeternum/HortaCore.ts",
      "lib/aeternum/WormholeRegistry.ts",
      "lib/aeternum/NeuralCoordinates.ts",
    ],
  },
  {
    id: "M2_ORCHESTRATION",
    name: "Orquestração",
    owner: "N01",
    state: "implemented",
    capabilities: ["lifecycle", "routing-contract", "module-coordination"],
    dependencies: ["M1_CORE"],
    evidence: ["lib/aeternum/AeternumOrchestrator.ts"],
  },
  {
    id: "M3_LANGUAGE",
    name: "Córtex de Linguagem",
    owner: "N05",
    state: "federated_contract",
    capabilities: ["conversation", "inference", "language"],
    dependencies: ["M2_ORCHESTRATION"],
    evidence: ["SOUL Mesh capability delegation to N05"],
  },
  {
    id: "M4_MIND",
    name: "Consciência e Cognição",
    owner: "N06",
    state: "adapter",
    capabilities: ["meta-cognition", "reasoning", "reflection"],
    dependencies: ["M2_ORCHESTRATION"],
    evidence: ["nextjs-ai-chatbot-2000/src/aeternum/MindModule.ts"],
  },
  {
    id: "M5_PERCEPTION",
    name: "Percepção e Análise",
    owner: "N03",
    state: "adapter",
    capabilities: ["audio", "speech", "multimodal"],
    dependencies: ["M1_CORE"],
    evidence: ["nexus-aeternum-fusion/src/aeternum/PerceptionModule.ts"],
  },
  {
    id: "M6_IMMUNITY",
    name: "Autocorreção e Estabilidade",
    owner: "N07_SARA",
    state: "implemented",
    capabilities: ["audit", "invariants", "rollback", "ethical-validation"],
    dependencies: ["M1_CORE", "M2_ORCHESTRATION"],
    evidence: [
      "SARA IdentityCore",
      "SARA EmergencyRollback",
      "SARA InvariantValidator",
      "SARA EthicalFilterChain",
    ],
  },
  {
    id: "M7_EVOLUTION",
    name: "Evolução e Capacidades",
    owner: "N07_SARA",
    state: "implemented",
    capabilities: ["regeneration", "capability-governance", "provenance"],
    dependencies: ["M6_IMMUNITY"],
    evidence: [
      "SARA ARAForge",
      "SARA RegenerativeLoop",
      "SARA InnovationRadar",
    ],
  },
  {
    id: "M8_GOVERNANCE_MEMORY",
    name: "Governança e Memória",
    owner: "N07_SARA",
    state: "implemented",
    capabilities: ["long-term-memory", "governance", "trace", "provenance"],
    dependencies: ["M1_CORE", "M6_IMMUNITY"],
    evidence: [
      "SARA RegenerativeMemory",
      "SARA TemporalVectorDB",
      "SARA DecisionTrace",
      "SARA GovernanceBackend",
    ],
  },
] as const;

export function aeternumModule(id: AeternumModuleDescriptor["id"]) {
  return AETERNUM_8_MODULES.find(item => item.id === id);
}

export function validateAeternumModuleGraph(): string[] {
  const known = new Set(AETERNUM_8_MODULES.map(item => item.id));
  const problems: string[] = [];
  for (const item of AETERNUM_8_MODULES) {
    for (const dependency of item.dependencies) {
      if (!known.has(dependency)) problems.push(item.id + " -> " + dependency);
    }
  }
  return problems;
}
