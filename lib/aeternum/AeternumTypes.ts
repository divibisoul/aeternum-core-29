export type AeternumModuleId =
  | "M1_CORE"
  | "M2_ORCHESTRATION"
  | "M3_LANGUAGE"
  | "M4_MIND"
  | "M5_PERCEPTION"
  | "M6_IMMUNITY"
  | "M7_EVOLUTION"
  | "M8_GOVERNANCE_MEMORY";

export type AeternumOwner = "N01" | "N03" | "N05" | "N06" | "N07_SARA";

export type AeternumImplementationState =
  | "implemented"
  | "adapter"
  | "federated_contract"
  | "pending_external_runtime";

export interface AeternumModuleDescriptor {
  id: AeternumModuleId;
  name: string;
  owner: AeternumOwner;
  state: AeternumImplementationState;
  capabilities: string[];
  dependencies: AeternumModuleId[];
  evidence: string[];
}

export interface AeternumEvent<T = unknown> {
  event: string;
  data: T;
  timestamp: number;
  sequence: number;
}

export interface AeternumModuleHandler {
  activate?(): void | Promise<void>;
  deactivate?(): void | Promise<void>;
  handle?(event: string, data: unknown): unknown | Promise<unknown>;
}
