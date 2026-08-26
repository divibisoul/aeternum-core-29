import type { SoulMeshMessage, SoulMeshTransport, SoulNucleus } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';

export type SoulMeshHybridTransportOptions = {
  endpoints: Partial<Record<Exclude<SoulNucleus, 'N01'>, string>>;
  channelName?: string;
  headers?: Record<string, string>;
};

/**
 * N01 transport for heterogeneous runtimes.
 *
 * - HTTP/HTTPS is used when a peer endpoint is configured.
 * - BroadcastChannel is available for same-origin/WebView hybrid scenarios.
 * The logical message contract never changes with transport.
 */
export class SoulMeshHybridTransport implements SoulMeshTransport {
  private readonly listeners = new Set<(message: SoulMeshMessage) => void | Promise<void>>();
  private readonly endpoints: SoulMeshHybridTransportOptions['endpoints'];
  private readonly headers: Record<string, string>;
  private readonly channel?: BroadcastChannel;

  constructor(options: SoulMeshHybridTransportOptions) {
    this.endpoints = options.endpoints;
    this.headers = options.headers ?? {};
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(options.channelName ?? 'soul-mesh');
      this.channel.onmessage = (event) => {
        if (isSoulMeshMessage(event.data)) void this.deliver(event.data);
      };
    }
  }

  async send(message: SoulMeshMessage): Promise<void> {
    const endpoint = this.endpoints[message.target as Exclude<SoulNucleus, 'N01'>];
    if (endpoint) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...this.headers },
        body: JSON.stringify(message),
      });
      if (!response.ok) throw new Error(`Soul Mesh transport failed: ${response.status}`);
      return;
    }

    if (this.channel) {
      this.channel.postMessage(message);
      return;
    }

    throw new Error(`No Soul Mesh transport configured for ${message.target}`);
  }

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  private async deliver(message: SoulMeshMessage): Promise<void> {
    await Promise.allSettled([...this.listeners].map(listener => listener(message)));
  }

  close(): void {
    this.channel?.close();
    this.listeners.clear();
  }
}
