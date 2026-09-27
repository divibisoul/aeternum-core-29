export {
  uiSystemsMonitorModule,
  UISystemsMonitorModule,
  type UISystemTelemetry,
  type UISystemMonitorSnapshot,
} from "./UISystemsMonitorModule";
export {
  activeOperationsMonitorModule,
  ActiveOperationsMonitorModule,
  type OperationObservation,
} from "./ActiveOperationsMonitorModule";

/**
 * L5 is federated: additional monitor/card projections live in their
 * affinity nuclei and SARA. No second runtime is imported here.
 */
export const AETERNUM_LOTE5_MONITOR_FEDERATION = Object.freeze([
  { id: "L5.UISystemsMonitorModule", host: "N01", source: "aeternum-core-29" },
  { id: "L5.UISystemsMonitorUI", host: "N04", source: "nextjs-ai-chatbot-2000" },
  { id: "L5.ActiveOperationsMonitorModule", host: "N01", source: "aeternum-core-29" },
  { id: "L5.OperationStatusBarModule", host: "N02", source: "Eternium-" },
  { id: "L5.OperationProgressCardModule", host: "N02", source: "Eternium-" },
  { id: "L5.ExpertModeToggleModule", host: "SARA", source: "SARA" },
  { id: "L5.AgentCardModule", host: "N03", source: "nexus-aeternum-fusion" },
  { id: "L5.CapabilityCardModule", host: "N03", source: "nexus-aeternum-fusion" },
  { id: "L5.CoreModuleCardModule", host: "N04", source: "nextjs-ai-chatbots" },
  { id: "L5.SynthesisMetricsModule", host: "N06", source: "nextjs-ai-chatbot-2000" },
] as const);
