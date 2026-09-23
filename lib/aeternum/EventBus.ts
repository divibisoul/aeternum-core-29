import { EventBus as CoreEventBus } from "../../src/core/EventBus";
import type { AeternumEvent } from "./AeternumTypes";

type Listener<T = unknown> = (data: T) => void | Promise<void>;
type Unsubscribe = () => void;
type BridgeEnvelope = { event: string; data: unknown };

/**
 * Typed AETERNUM event facade over the existing N01 EventBus.
 * This class intentionally owns no independent listeners, dispatch loop, or history.
 */
export class AeternumEventBus {
  private readonly subscriptions = new Map<string, Set<Unsubscribe>>();

  on<T>(event: string, listener: Listener<T>): Unsubscribe {
    const wrapped = async (payload: BridgeEnvelope) => {
      if (payload?.event !== event) return;
      await listener(payload.data as T);
    };
    const coreUnsubscribe = CoreEventBus.on("aeternum:bridge", wrapped);
    const eventSubscriptions = this.subscriptions.get(event) ?? new Set<Unsubscribe>();
    const unsubscribe: Unsubscribe = () => {
      coreUnsubscribe();
      eventSubscriptions.delete(unsubscribe);
      if (eventSubscriptions.size === 0) this.subscriptions.delete(event);
    };
    eventSubscriptions.add(unsubscribe);
    this.subscriptions.set(event, eventSubscriptions);
    return unsubscribe;
  }

  once<T>(event: string, listener: Listener<T>): Unsubscribe {
    let unsubscribe: Unsubscribe = () => undefined;
    unsubscribe = this.on<T>(event, async (data) => {
      unsubscribe();
      await listener(data);
    });
    return unsubscribe;
  }

  off(event: string): void {
    const subscriptions = [...(this.subscriptions.get(event) ?? [])];
    for (const unsubscribe of subscriptions) unsubscribe();
  }

  async emit<T>(event: string, data: T): Promise<number> {
    const listeners = this.subscriptions.get(event)?.size ?? 0;
    await CoreEventBus.emit("aeternum:bridge", { event, data });
    return listeners;
  }

  getHistory(): AeternumEvent[] {
    let sequence = 0;
    return CoreEventBus.getLog()
      .filter(item => item.event === "aeternum:bridge")
      .map(item => {
        const envelope = item.data as BridgeEnvelope;
        return {
          event: envelope.event,
          data: envelope.data,
          timestamp: item.timestamp,
          sequence: ++sequence,
        };
      });
  }

  getRegisteredEvents(): string[] {
    return [...this.subscriptions.keys()].sort();
  }
}

export const aeternumBus = new AeternumEventBus();
