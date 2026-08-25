import type { SoulMeshMessage, SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';

/** Routes every R1 message through the shared Soul Mesh transport using the message target. */
export class SoulMeshPeerTransport implements SoulMeshTransport {
  constructor(private readonly transport: SoulMeshTransport, private readonly local: SoulNucleus) {}
  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    return this.transport.onMessage(async (message) => {
      if (message.target === this.local) await handler(message);
    });
  }
  async send(message: SoulMeshMessage): Promise<void> {
    if (message.source !== this.local) throw new Error(`Invalid Soul Mesh source: ${message.source}`);
    await this.transport.send(message);
  }
}
