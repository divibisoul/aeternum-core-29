import type { SoulMeshMessage } from './SoulMeshProtocol';
import { SoulMeshHttpTransport } from './SoulMeshHttpTransport';

export interface N01MeshTransportAdapter {
  send(message: SoulMeshMessage): Promise<void>;
  close?(): Promise<void> | void;
}

/** Current HTTP implementation. Channel identity and router contracts do not depend on it. */
export class N01HttpTransportAdapter implements N01MeshTransportAdapter {
  private readonly transport: SoulMeshHttpTransport;

  constructor(endpoint: string, authToken?: string) {
    this.transport = new SoulMeshHttpTransport(endpoint, {
      authToken,
      timeoutMs: 3000,
      retries: 3,
      retryDelayMs: 100,
    });
  }

  send(message: SoulMeshMessage): Promise<void> {
    return this.transport.send(message);
  }
}

/** Future Android/WebSocket implementation boundary; intentionally transport-only. */
export interface N01WebSocketTransportAdapter extends N01MeshTransportAdapter {
  send(message: SoulMeshMessage): Promise<void>;
}

/** Android-native transport can implement this same contract using Capacitor/WebView or native networking. */
export interface N01AndroidTransportAdapter extends N01MeshTransportAdapter {
  send(message: SoulMeshMessage): Promise<void>;
}
