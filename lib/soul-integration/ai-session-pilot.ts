import { createExecutionEnvelope, executionWasReal, type SoulExecutionReceipt } from './soul-cognitive-signature';

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
  receipt: SoulExecutionReceipt;
}

/**
 * Keeps the user's logged-in WebView AI session outside the nuclei.
 * The APK owns the session; the GPU fabric consumes it through this boundary.
 *
 * The bridge does not impersonate a provider and does not expose credentials
 * to nuclei. It produces an execution receipt so the Cockpit can distinguish
 * a real provider response from a merely planned/dispatched task.
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

    const taskId = crypto.randomUUID();
    const startedAt = Date.now();
    const envelope = createExecutionEnvelope({
      taskId,
      capability: 'ai.session.inference',
      sourceNucleus: 'N01',
      targetNucleus: 'AI_SESSION',
      channelId: 'N01.OUT.AI_SESSION',
      transport: 'WEBVIEW_BRIDGE',
      input,
    });

    try {
      const output = await this.session.send(input, context);
      const completedAt = Date.now();
      const receipt: SoulExecutionReceipt = {
        taskId,
        capability: envelope.capability,
        proof: 'EXECUTED',
        sourceNucleus: envelope.sourceNucleus,
        targetNucleus: envelope.targetNucleus,
        channelId: envelope.channelId,
        transport: envelope.transport,
        output,
        startedAt,
        completedAt,
      };

      if (!executionWasReal(receipt)) {
        throw new Error('AI_SESSION_EXECUTION_PROOF_INVALID');
      }

      return { taskId, output, source: 'AI_SESSION', receipt };
    } catch (error) {
      throw new Error(
        `AI_SESSION_EXECUTION_FAILED:${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
