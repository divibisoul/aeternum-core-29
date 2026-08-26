import type { SoulMeshMessage, SoulMeshTransport } from './SoulMeshProtocol';
import { isSoulMeshMessage } from './SoulMeshProtocol';

export type SoulMeshHttpTransportOptions = {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
};

/** HTTP transport for deployed nuclei. Response bodies are fed back into the router. */
export class SoulMeshHttpTransport implements SoulMeshTransport {
  private readonly listeners = new Set<(message: SoulMeshMessage) => void | Promise<void>>();
  private readonly headers: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly retryDelayMs: number;

  constructor(private readonly endpoint: string, options: SoulMeshHttpTransportOptions = {}) {
    if (!/^https?:\/\//i.test(endpoint)) throw new Error('Soul Mesh HTTP endpoint must be an absolute http(s) URL');
    this.headers = options.headers ?? {};
    this.timeoutMs = Math.max(1000, options.timeoutMs ?? 15000);
    this.retries = Math.max(0, Math.min(3, options.retries ?? 1));
    this.retryDelayMs = Math.max(50, options.retryDelayMs ?? 250);
  }

  async send(message: SoulMeshMessage): Promise<void> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json', ...this.headers },
          body: JSON.stringify(message),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Soul Mesh transport failed: HTTP ${response.status}`);
        if (response.status !== 204) {
          const contentType = response.headers.get('content-type') ?? '';
          if (contentType.includes('application/json')) {
            const body: unknown = await response.json();
            if (isSoulMeshMessage(body)) await this.receive(body);
          }
        }
        return;
      } catch (error) {
        lastError = error;
        if (attempt < this.retries) await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * (attempt + 1)));
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  onMessage(handler: (message: SoulMeshMessage) => void | Promise<void>): () => void {
    this.listeners.add(handler);
    return () => this.listeners.delete(handler);
  }

  async receive(message: SoulMeshMessage): Promise<void> {
    if (!isSoulMeshMessage(message)) throw new Error('Invalid Soul Mesh message');
    await Promise.allSettled([...this.listeners].map(listener => listener(message)));
  }
}
