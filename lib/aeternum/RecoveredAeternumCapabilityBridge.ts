import { architectureGuideModule } from "./governance/ArchitectureGuideModule";
import { blueprintModule, type BlueprintRequest } from "./evolution/BlueprintModule";
import { neuralForgeModule, type ForgeRequest } from "./evolution/NeuralForgeModule";
import { recoveredAeternumRuntime } from "./RecoveredAeternumRuntime";

export type RecoveredCapabilityId = "aeternum.architecture.guide" | "aeternum.blueprint.create" | "aeternum.neuralforge.create";

export const AETERNUM_RECOVERED_CAPABILITIES = [
  "aeternum.architecture.guide",
  "aeternum.blueprint.create",
  "aeternum.neuralforge.create",
] as const;

export class RecoveredAeternumCapabilityBridge {
  constructor() { recoveredAeternumRuntime.boot(); }

  async execute(capability: RecoveredCapabilityId, payload: unknown): Promise<unknown> {
    switch (capability) {
      case "aeternum.architecture.guide":
        architectureGuideModule.activate();
        return architectureGuideModule.guide((payload as { domain?: string } | null)?.domain);
      case "aeternum.blueprint.create":
        blueprintModule.activate();
        return blueprintModule.create(payload as BlueprintRequest);
      case "aeternum.neuralforge.create":
        neuralForgeModule.activate();
        return neuralForgeModule.forge(payload as ForgeRequest);
      default: {
        const exhaustive: never = capability;
        throw new Error("AETERNUM_RECOVERED_CAPABILITY_UNHANDLED:" + exhaustive);
      }
    }
  }
}

export const recoveredAeternumCapabilityBridge = new RecoveredAeternumCapabilityBridge();