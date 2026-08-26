import type { SoulMeshMessage, SoulNucleus, SoulMeshTransport } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';

/** Routes Soul Mesh messages through a shared transport while enforcing peer identity at the boundary. */
export class SoulMeshPeerTransport implements SoulMeshTransport {
  constructor(private readonly transport: SoulMeshTransport, private readonly local: SoulNucleus) {}

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    return this.transport.onMessage(async (message) => {
      if (!isSoulMeshMessage(message)) return;
      if (message.target !== this.local) return;
      if (message.source === this.local) return;
      await handler(message);
    });
  }

  async send(message: SoulMeshMessage): Promise<void> {
    if (!isSoulMeshMessage(message)) {
      throw new Error('Invalid Soul Mesh message');
    }
    if (message.source !== this.local) {
      throw new Error(`Invalid Soul Mesh source: ${message.source}`);
    }
    if (message.target === this.local) {
      throw new Error('Soul Mesh target must be a remote nucleus');
    }
    await this.transport.send(message);
  }
}
