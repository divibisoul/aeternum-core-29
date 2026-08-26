export interface SoulAiSession {
  id: string;
  provider: string;
  authenticated: boolean;
  send: (input: string, context?: unknown) => Promise<string>;
}

export interface SoulPilotTask {
  id: string;
  capability: string;
  input: unknown;
  parallel?: boolean;
}

export interface SoulPilotResult {
  taskId: string;
  output: unknown;
  source: 'AI_SESSION' | 'NUCLEUS';
}

/**
 * Keeps the user's logged-in WebView AI session outside the nuclei.
 * The APK owns the session; the GPU fabric consumes it through this boundary.
 */
export class SoulAiSessionPilotBridge {
  private session?: SoulAiSession;

  attach(session: SoulAiSession): void {
    this.session = session;
  }

  detach(): void {
    this.session = undefined;
  }

  get connected(): boolean {
    return Boolean(this.session?.authenticated);
  }

  async ask(input: string, context?: unknown): Promise<SoulPilotResult> {
    if (!this.session?.authenticated) {
      throw new Error('AI_SESSION_NOT_CONNECTED');
    }
    return {
      taskId: crypto.randomUUID(),
      output: await this.session.send(input, context),
      source: 'AI_SESSION',
    };
  }
}
