import { hortaCore } from "../../src/core/hortaCore";
import { architectureGuideModule } from "./governance/ArchitectureGuideModule";
import { AeternumOrchestrator } from "./AeternumOrchestrator";
import { aeternumBus } from "./EventBus";
import { aeternumHortaCore } from "./HortaCore";
import { aeternumWormhole } from "./WormholeRegistry";
import { blueprintModule } from "./evolution/BlueprintModule";
import { neuralForgeModule } from "./evolution/NeuralForgeModule";
import {
  recoveredAeternumHortaBridge,
  RecoveredAeternumHortaBridge,
} from "./RecoveredAeternumHortaBridge";

/**
 * Recovered Aeternum runtime bootstrap.
 *
 * Bootstraps the recovered module graph and the state bridge without
 * auto-activating historical modules or inventing executors.
 */
export class RecoveredAeternumRuntime {
  private booted = false;

  constructor(
    private readonly orchestrator: AeternumOrchestrator = new AeternumOrchestrator(),
    private readonly bridge: RecoveredAeternumHortaBridge = recoveredAeternumHortaBridge,
  ) {}

  boot(): {
    booted: boolean;
    modules: number;
    connections: number;
    bridge: ReturnType<RecoveredAeternumHortaBridge["status"]>;
  } {
    if (!this.booted) {
      this.bridge.connect();
      this.orchestrator.boot();

      void blueprintModule;
      void neuralForgeModule;
      void architectureGuideModule;

      this.booted = true;

      hortaCore.set("continuity.recovered.aeternum.runtime", {
        status: "BOOTED",
        modules: this.orchestrator.listModules().length,
        connections: this.orchestrator.listConnections().length,
        eventBus: "canonical-n01",
        hortaSource: "historical-aeternum",
        activation: "NOT_AUTOMATIC",
        at: Date.now(),
      });

      void aeternumBus.emit("recovery.aeternum.booted", {
        modules: this.orchestrator.listModules().length,
      });
    }

    return {
      booted: this.booted,
      modules: this.orchestrator.listModules().length,
      connections: this.orchestrator.listConnections().length,
      bridge: this.bridge.status(),
    };
  }

  getSources(): {
    orchestrator: AeternumOrchestrator;
    horta: typeof aeternumHortaCore;
    wormhole: typeof aeternumWormhole;
  } {
    return {
      orchestrator: this.orchestrator,
      horta: aeternumHortaCore,
      wormhole: aeternumWormhole,
    };
  }
}

export const recoveredAeternumRuntime = new RecoveredAeternumRuntime();
