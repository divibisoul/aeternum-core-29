export { vagusNerveServiceModule, VagusNerveServiceModule } from "./VagusNerveServiceModule";
export { vagusNerveReportModule, VagusNerveReportModule } from "./VagusNerveReportModule";
export { VagusNerveReportUI } from "./VagusNerveReportUI";
export { unifiedCommandPipelineModule, UnifiedCommandPipelineModule } from "./UnifiedCommandPipelineModule";
export { systemIntegrationModule, SystemIntegrationModule } from "./SystemIntegrationModule";
export { architectureGuideModule, ArchitectureGuideModule } from "./ArchitectureGuideModule";
export { memoryModule, MemoryModule } from "./MemoryModule";

export const AETERNUM_GOVERNANCE_NETWORK = Object.freeze([
  { id: "M8.vagus-nerve-service", owner: "N01", authority: "M1_CORE" },
  { id: "M8.vagus-nerve-report", owner: "N01", authority: "M1_CORE" },
  { id: "M2.unified-command-pipeline", owner: "N01", authority: "M2_ORCHESTRATION" },
  { id: "M2.system-integration", owner: "N01", authority: "M2_ORCHESTRATION" },
  { id: "M2.architecture-guide", owner: "N01", authority: "M2_ORCHESTRATION" },
  { id: "M8.governance-report", owner: "N07_SARA", authority: "GovernanceBackend" },
  { id: "M8.enforcement-pipeline", owner: "N07_SARA", authority: "GovernedSARA" },
  { id: "M8.memory", owner: "N07_SARA", authority: "RegenerativeMemory" },
  { id: "M8.orientation-guide", owner: "N06", authority: "M4_MIND" },
] as const);
