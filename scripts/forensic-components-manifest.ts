export const HORTACORE_COMPONENTS = ["codex","blueprint","eru","audit","guide"] as const;

export const COMMUNICATION_COMPONENTS = ["nvod","vagus_gateway","horta_orchestrator"] as const;

export const CONTROLLER_COMPONENTS = ["geminiServices"] as const;

export const MODULE_COMPONENTS = [
  "acai","mpvs","multimodal_cortex","autonomous_embodiment",
  "neural_forge","asc","biomolecular_designer","reality_synthesis","strategic_planning",
  "csae","dcrs","adaptation_module","scre","ecas",
  "eus","mlfg","emergent_cognition","bnc_v2","skill_acquisition",
  "uci",
  "ethical_governance","strategic_defense","existential_safety",
  "einstein_reasoning","einstein_code","einstein_quantum",
  "cot_arhd","cot_drc","cot_area"
] as const;

export const PANEL_COMPONENTS = [
  "engineering_panel","hortacore_widget","metrics_widget","heartbeat_widget"
] as const;

export const SARA_CHIMERA_COMPONENTS = [
  "sara_fusion_engine","fusion_matrix","core_values","quantum_processor"
] as const;

export const CONFIRMED_COMPONENTS = [
  ...HORTACORE_COMPONENTS,
  ...COMMUNICATION_COMPONENTS,
  ...CONTROLLER_COMPONENTS,
  ...MODULE_COMPONENTS,
  ...PANEL_COMPONENTS,
  ...SARA_CHIMERA_COMPONENTS,
] as const;

export const TOTAL_CONFIRMED_COMPONENTS = 46;

if (CONFIRMED_COMPONENTS.length !== TOTAL_CONFIRMED_COMPONENTS) {
  throw new Error(`Forensic manifest invariant violated: expected ${TOTAL_CONFIRMED_COMPONENTS}, got ${CONFIRMED_COMPONENTS.length}`);
}
