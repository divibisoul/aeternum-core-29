import type { SoulMeshMessage, SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';

/** Routes every Soul Mesh message through the shared transport using source/target identities. */
export class SoulMeshPeerTransport implements SoulMeshTransport {
  constructor(private readonly transport: SoulMeshTransport, private readonly local: SoulNucleus) {}

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    return this.transport.onMessage(async (message) => {
      if (message.target !== this.local) return;
      await handler(message);
    });
  }

  async send(message: SoulMeshMessage): Promise<void> {
    if (message.source !== this.local) {
      throw new Error(`Invalid Soul Mesh source: ${message.source}`);
    }
    if (message.target === this.local) {
      throw new Error('Soul Mesh target must be a remote nucleus');
    }
    await this.transport.send(message);
  }
}
