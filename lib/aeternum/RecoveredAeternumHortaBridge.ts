import { hortaCore } from "../../src/core/hortaCore";
import { aeternumHortaCore, type HortaChange } from "./HortaCore";

/**
 * Continuity bridge for recovered Aeternum state.
 *
 * Historical Aeternum modules keep their own HortaCore instance so their
 * original behavior remains intact. This bridge mirrors that state into the
 * current N01 HortaCore under a namespaced key and never replaces the source.
 */
export class RecoveredAeternumHortaBridge {
  private connected = false;
  private unsubscribe: (() => void) | null = null;
  private mirroredChanges = 0;

  connect(): void {
    if (this.connected) return;

    this.connected = true;
    for (const [key, value] of Object.entries(aeternumHortaCore.snapshot())) {
      this.mirror({ key, oldValue: undefined, newValue: value, timestamp: Date.now(), sequence: 0 });
    }

    this.unsubscribe = aeternumHortaCore.observeAll((change) => this.mirror(change));
    hortaCore.set("continuity.recovered.aeternum.bridge", {
      connected: true,
      source: "lib/aeternum/HortaCore",
      target: "src/core/hortaCore",
      mirroredChanges: this.mirroredChanges,
      at: Date.now(),
    });
  }

  disconnect(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.connected = false;
    hortaCore.set("continuity.recovered.aeternum.bridge", {
      connected: false,
      source: "lib/aeternum/HortaCore",
      target: "src/core/hortaCore",
      mirroredChanges: this.mirroredChanges,
      at: Date.now(),
    });
  }

  status(): {
    connected: boolean;
    mirroredChanges: number;
    sourceKeys: number;
    currentKeys: number;
  } {
    return {
      connected: this.connected,
      mirroredChanges: this.mirroredChanges,
      sourceKeys: aeternumHortaCore.keys().length,
      currentKeys: hortaCore.keys().length,
    };
  }

  private mirror(change: HortaChange): void {
    this.mirroredChanges += 1;
    const prefix = `continuity.recovered.aeternum.state.${change.key}`;
    hortaCore.set(prefix, change.newValue);
    hortaCore.set("continuity.recovered.aeternum.lastChange", {
      key: change.key,
      sourceSequence: change.sequence,
      timestamp: change.timestamp,
      mirroredAt: Date.now(),
    });
  }
}

export const recoveredAeternumHortaBridge = new RecoveredAeternumHortaBridge();
