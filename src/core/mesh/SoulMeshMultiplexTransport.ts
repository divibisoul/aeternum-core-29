import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';

/**
 * Hybrid transport with ordered failover. A message is sent once through the
 * first working transport; later transports are fallbacks, preventing duplicate
 * remote execution while preserving multiple communication paths.
 *
 * Inbound deliveries are also deduplicated for a bounded TTL because the same
 * envelope can legitimately arrive through more than one communication path.
 */
export class SoulMeshMultiplexTransport implements SoulMeshTransport {
  private readonly listeners = new Set<(message: SoulMeshMessage) => void | Promise<void>>();
  private readonly unsubs: (() => void)[] = [];
  private readonly seen = new Map<string, number>();
  private readonly dedupeTtlMs = 60_000;

  constructor(private readonly transports: readonly SoulMeshTransport[]) {
    if (transports.length === 0) throw new Error('Soul Mesh requires at least one transport');
    for (const transport of transports) {
      this.unsubs.push(transport.onMessage(message => {
        const now = Date.now();
        for (const [id, expiresAt] of this.seen) {
          if (expiresAt <= now) this.seen.delete(id);
        }
        const expiresAt = this.seen.get(message.id);
        if (expiresAt !== undefined && expiresAt > now) return Promise.resolve();
        this.seen.set(message.id, now + this.dedupeTtlMs);
        return Promise.allSettled([...this.listeners].map(listener => listener(message))).then(() => undefined);
      }));
    }
  }

  async send(message: SoulMeshMessage): Promise<void> {
    const failures: unknown[] = [];
    for (const transport of this.transports) {
      try {
        await transport.send(message);
        return;
      } catch (error) {
        failures.push(error);
      }
    }
    throw new Error(`Soul Mesh all transports failed: ${failures.map(String).join(' | ')}`);
  }

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  close(): void {
    for (const unsubscribe of this.unsubs) unsubscribe();
    this.unsubs.length = 0;
    this.listeners.clear();
    this.seen.clear();
  }
}
