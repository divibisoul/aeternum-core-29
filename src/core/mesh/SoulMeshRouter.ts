import { EventBus } from '../EventBus';
import type { SoulCoreId, SoulMeshEnvelope } from '../contracts/SoulMeshContract';

/** Routes inter-core messages without coupling one core's implementation to another. */
export class SoulMeshRouter {
  private readonly handlers = new Map<SoulCoreId | '*', Set<(message: SoulMeshEnvelope) => void>>();

  subscribe(target: SoulCoreId | '*', handler: (message: SoulMeshEnvelope) => void): () => void {
    const set = this.handlers.get(target) ?? new Set();
    set.add(handler);
    this.handlers.set(target, set);
    return () => set.delete(handler);
  }

  publish(message: SoulMeshEnvelope): void {
    this.handlers.get(message.target)?.forEach(handler => handler(message));
    this.handlers.get('*')?.forEach(handler => handler(message));
    EventBus.emit('module:activated', { id: `mesh:${message.source}:${message.kind}` });
  }
}

export const soulMeshRouter = new SoulMeshRouter();
