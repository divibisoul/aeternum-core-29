import { hortaCore } from "../../src/core/hortaCore";
import { aeternumHortaCore, type HortaChange } from "./HortaCore";

/** Mirrors recovered Aeternum state into the current N01 HortaCore. */
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
    hortaCore.set("continuity.recovered.aeternum.bridge", this.status());
  }

  disconnect(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.connected = false;
    hortaCore.set("continuity.recovered.aeternum.bridge", this.status());
  }

  status() {
    return {
      connected: this.connected,
      mirroredChanges: this.mirroredChanges,
      sourceKeys: aeternumHortaCore.keys().length,
      targetKeys: hortaCore.keys().length,
    };
  }

  private mirror(change: HortaChange): void {
    this.mirroredChanges += 1;
    hortaCore.set("continuity.recovered.aeternum.state." + change.key, change.newValue);
    hortaCore.set("continuity.recovered.aeternum.lastChange", {
      key: change.key,
      sourceSequence: change.sequence,
      timestamp: change.timestamp,
      mirroredAt: Date.now(),
    });
  }
}

export const recoveredAeternumHortaBridge = new RecoveredAeternumHortaBridge();