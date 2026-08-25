import type { SoulMeshMessage, SoulMeshTransport, SoulNucleus } from './SoulMeshProtocol';

/** Core mesh hub. It routes messages between nuclei without owning their implementations. */
export class SoulMeshHub {
  private readonly handlers = new Map<SoulNucleus, (message: SoulMeshMessage) => void | Promise<void>>();
  constructor(private readonly transport: SoulMeshTransport) {}
  register(nucleus: SoulNucleus, handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    this.handlers.set(nucleus, handler);
    return () => this.handlers.delete(nucleus);
  }
  async send(message: SoulMeshMessage): Promise<void> { await this.transport.send(message); }
  async receive(message: SoulMeshMessage): Promise<void> {
    const handler = this.handlers.get(message.target);
    if (handler) await handler(message);
  }
}
