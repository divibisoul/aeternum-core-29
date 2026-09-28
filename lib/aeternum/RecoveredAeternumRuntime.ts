import { hortaCore } from "../../src/core/hortaCore";
import { architectureGuideModule } from "./governance/ArchitectureGuideModule";
import { AeternumOrchestrator, aeternumBus, aeternumHortaCore, aeternumWormhole } from "./AeternumOrchestrator";
import { blueprintModule } from "./evolution/BlueprintModule";
import { neuralForgeModule } from "./evolution/NeuralForgeModule";
import {
  recoveredAeternumHortaBridge,
  RecoveredAeternumHortaBridge,
} from "./RecoveredAeternumHortaBridge";

/**
 * Recovered Aeternum runtime bootstrap.
 *
 * This intentionally bootstraps only the recovered module graph and transport
 * bridge. It does not auto-activate historical modules, invent executors or
 * change their ownership. NeuralForge remains truthful when no executor is
 * bound, and governance/regeneration authority remains external to N01.
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

      // Touch the recovered singleton modules so their native event listeners
      // are installed as part of the bootstrap. No module is auto-activated.
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
