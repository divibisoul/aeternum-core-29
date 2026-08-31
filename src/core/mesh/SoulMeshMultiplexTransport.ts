import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';

/**
 * Hybrid transport with ordered failover. A message is sent once through the
 * first working transport; later transports are fallbacks, preventing duplicate
 * remote execution while preserving multiple communication paths.
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
  }
}
