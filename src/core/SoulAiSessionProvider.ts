export type SoulAiProviderRequest = { prompt: string; context?: Record<string, unknown>; capability?: string };
export type SoulAiProviderResponse = { text: string; raw?: unknown };

export interface SoulAiProvider {
  readonly id: string;
  invoke(request: SoulAiProviderRequest): Promise<SoulAiProviderResponse>;
}

/**
 * The APK owns the AI session boundary, not an AI vendor. The WebView/session
 * implementation supplies an authenticated provider; nuclei consume this interface.
 */
export class SoulAiSessionProviderRegistry {
  private provider?: SoulAiProvider;

  attach(provider: SoulAiProvider) { this.provider = provider; }
  detach() { this.provider = undefined; }
  isAttached() { return !!this.provider; }
  async invoke(request: SoulAiProviderRequest) {
    if (!this.provider) throw new Error('SOUL_AI_SESSION_NOT_ATTACHED');
    return this.provider.invoke(request);
  }
}

export const soulAiSessionProvider = new SoulAiSessionProviderRegistry();
