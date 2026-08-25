import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const topic = (import.meta.env.VITE_SOUL_MESH_TOPIC as string | undefined) ?? 'soul-mesh-v1';

if (!url || !key) {
  throw new Error('Soul Mesh requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
}

/** Real bidirectional transport for browser nuclei using Supabase Realtime Broadcast. */
export class SoulMeshSupabaseTransport implements SoulMeshTransport {
  private readonly channel: RealtimeChannel;
  private readonly handlers = new Set<(message: SoulMeshMessage) => void | Promise<void>>();
  private readonly ready: Promise<void>;

  constructor(private readonly client: SupabaseClient = createClient(url, key)) {
    this.channel = client.channel(topic, { config: { broadcast: { ack: true, self: false } } });
    this.channel.on('broadcast', { event: 'soul-mesh' }, ({ payload }) => {
      if (!payload || typeof payload !== 'object') return;
      const message = payload as SoulMeshMessage;
      for (const handler of this.handlers) void Promise.resolve(handler(message));
    });
    this.ready = new Promise((resolve, reject) => {
      this.channel.subscribe((status, error) => {
        if (status === 'SUBSCRIBED') resolve();
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') reject(error ?? new Error(`Soul Mesh channel ${status}`));
      });
    });
  }

  async send(message: SoulMeshMessage): Promise<void> {
    await this.ready;
    const result = await this.channel.send({ type: 'broadcast', event: 'soul-mesh', payload: message });
    if (result !== 'ok') throw new Error(`Soul Mesh broadcast failed: ${result}`);
  }

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async close(): Promise<void> {
    await this.client.removeChannel(this.channel);
  }
}
