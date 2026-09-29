import { hortaCore } from "../../src/core/hortaCore";
import { architectureGuideModule } from "./governance/ArchitectureGuideModule";
import { AETERNUM_8_MODULES } from "./AeternumModuleMap";
import { AeternumOrchestrator } from "./AeternumOrchestrator";
import { aeternumHortaCore } from "./HortaCore";
import { aeternumWormhole } from "./WormholeRegistry";
import { blueprintModule } from "./evolution/BlueprintModule";
import { neuralForgeModule } from "./evolution/NeuralForgeModule";
import { recoveredAeternumHortaBridge, RecoveredAeternumHortaBridge } from "./RecoveredAeternumHortaBridge";

export class RecoveredAeternumRuntime {
  private booted = false;
  constructor(
    private readonly orchestrator: AeternumOrchestrator = new AeternumOrchestrator(),
    private readonly bridge: RecoveredAeternumHortaBridge = recoveredAeternumHortaBridge,
  ) {}

  boot() {
    if (!this.booted) {
      this.bridge.connect();
      this.orchestrator.boot();
      void architectureGuideModule;
      void blueprintModule;
      void neuralForgeModule;
      this.booted = true;
      hortaCore.set("continuity.recovered.aeternum.runtime", {
        status: "BOOTED",
        modules: AETERNUM_8_MODULES.length,
        connections: this.orchestrator.listConnections().length,
        activation: "EXPLICIT_ONLY",
        neuralForgeExecution: "not_claimed",
        at: Date.now(),
      });
    }
    return this.status();
  }

  status() {
    const bridge = this.bridge.status();
    return {
      booted: this.booted,
      modules: this.orchestrator.listModules().length,
      connections: this.orchestrator.listConnections().length,
      sourceStateKeys: bridge.sourceKeys,
      currentStateKeys: bridge.targetKeys,
      neuralForgeExecution: "not_claimed" as const,
    };
  }

  getSources() {
    return { orchestrator: this.orchestrator, horta: aeternumHortaCore, wormhole: aeternumWormhole };
  }
}

export const recoveredAeternumRuntime = new RecoveredAeternumRuntime();