import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';

/**
 * Hybrid transport: sends through every configured transport and accepts
 * inbound messages from all of them. One channel failing does not disable
 * the others; callers receive an error only when every channel fails.
 */
export class SoulMeshMultiplexTransport implements SoulMeshTransport {
  private readonly listeners = new Set<(message: SoulMeshMessage) => void | Promise<void>>();
  private readonly unsubs: (() => void)[] = [];

  constructor(private readonly transports: readonly SoulMeshTransport[]) {
    if (transports.length === 0) throw new Error('Soul Mesh requires at least one transport');
    for (const transport of transports) {
      this.unsubs.push(transport.onMessage(message =>
        Promise.allSettled([...this.listeners].map(listener => listener(message))).then(() => undefined),
      ));
    }
  }

  async send(message: SoulMeshMessage): Promise<void> {
    const results = await Promise.allSettled(this.transports.map(transport => transport.send(message)));
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length === results.length) {
      throw new Error(`Soul Mesh all transports failed: ${failures.map(f => String(f.reason)).join(' | ')}`);
    }
  }

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  close(): void {
    for (const unsubscribe of this.unsubs) unsubscribe();
    this.unsubs.length = 0;
    this.listeners.clear();
  }
}
