export type BrowserSessionStatus = 'DISCONNECTED' | 'CONNECTED' | 'DEGRADED';

export interface BrowserSessionMessage {
  type: 'SOUL_BROWSER_REQUEST' | 'SOUL_BROWSER_RESULT' | 'SOUL_BROWSER_STATUS';
  correlationId: string;
  payload?: unknown;
}

export interface BrowserSessionBridge {
  readonly id: 'browser-session';
  status(): BrowserSessionStatus;
  request(message: BrowserSessionMessage): Promise<BrowserSessionMessage>;
}

function isValidMessage(value: unknown): value is BrowserSessionMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BrowserSessionMessage>;
  return (candidate.type === 'SOUL_BROWSER_RESULT' || candidate.type === 'SOUL_BROWSER_STATUS') &&
    typeof candidate.correlationId === 'string' && candidate.correlationId.length > 0;
}

/** Same-origin session bridge. Credentials are deliberately excluded from the contract. */
export class WindowBrowserSessionBridge implements BrowserSessionBridge {
  readonly id = 'browser-session' as const;
  private currentStatus: BrowserSessionStatus = 'DISCONNECTED';

  status(): BrowserSessionStatus { return this.currentStatus; }

  async request(message: BrowserSessionMessage): Promise<BrowserSessionMessage> {
    if (!message.correlationId || !message.type) throw new Error('Invalid browser session request');
    if (typeof window === 'undefined') {
      this.currentStatus = 'DISCONNECTED';
      throw new Error('Browser session unavailable outside a browser context');
    }

    return await new Promise<BrowserSessionMessage>((resolve, reject) => {
      const onMessage = (event: MessageEvent) => {
        if (event.source !== window || event.origin !== window.location.origin) return;
        if (!isValidMessage(event.data) || event.data.correlationId !== message.correlationId) return;
        cleanup();
        this.currentStatus = 'CONNECTED';
        resolve(event.data);
      };
      const timeout = window.setTimeout(() => {
        cleanup();
        this.currentStatus = 'DEGRADED';
        reject(new Error(`Browser session timeout: ${message.correlationId}`));
      }, 10000);
      const cleanup = () => {
        window.clearTimeout(timeout);
        window.removeEventListener('message', onMessage);
      };
      window.addEventListener('message', onMessage);
      window.postMessage({ source: 'SOUL', ...message }, window.location.origin);
    });
  }
}
