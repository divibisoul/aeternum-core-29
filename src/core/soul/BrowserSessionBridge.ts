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

/** Browser bridge contract: session messages only; passwords/raw credentials never enter SOUL. */
export class WindowBrowserSessionBridge implements BrowserSessionBridge {
  readonly id = 'browser-session' as const;
  private currentStatus: BrowserSessionStatus = 'DISCONNECTED';

  status(): BrowserSessionStatus { return this.currentStatus; }

  async request(message: BrowserSessionMessage): Promise<BrowserSessionMessage> {
    if (typeof window === 'undefined') {
      this.currentStatus = 'DISCONNECTED';
      throw new Error('Browser session unavailable outside a browser context');
    }

    this.currentStatus = 'CONNECTED';
    window.postMessage({ source: 'SOUL', ...message }, window.location.origin);

    return await new Promise<BrowserSessionMessage>((resolve, reject) => {
      const onMessage = (event: MessageEvent) => {
        if (event.source !== window || event.origin !== window.location.origin) return;
        const data = event.data as Partial<BrowserSessionMessage> | undefined;
        if (data?.type !== 'SOUL_BROWSER_RESULT' || data.correlationId !== message.correlationId) return;
        window.clearTimeout(timeout);
        window.removeEventListener('message', onMessage);
        this.currentStatus = 'CONNECTED';
        resolve(data as BrowserSessionMessage);
      };
      const timeout = window.setTimeout(() => {
        window.removeEventListener('message', onMessage);
        this.currentStatus = 'DEGRADED';
        reject(new Error(`Browser session timeout: ${message.correlationId}`));
      }, 10000);
      window.addEventListener('message', onMessage);
    });
  }
}
