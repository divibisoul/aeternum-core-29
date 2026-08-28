export type ProviderKind = 'local' | 'browser' | 'cloud';

export interface CognitiveRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface CognitiveResponse {
  content: string;
  provider: string;
  kind: ProviderKind;
  latencyMs: number;
  usage?: Record<string, number>;
}

export interface CognitiveProvider {
  readonly id: string;
  readonly kind: ProviderKind;
  isAvailable(): Promise<boolean>;
  generate(request: CognitiveRequest): Promise<CognitiveResponse>;
}

export class ProviderUnavailableError extends Error {
  constructor(public readonly providerId: string, message = `Provider unavailable: ${providerId}`) {
    super(message);
    this.name = 'ProviderUnavailableError';
  }
}

export async function generateWithFallback(providers: readonly CognitiveProvider[], request: CognitiveRequest): Promise<CognitiveResponse> {
  let lastError: unknown;
  for (const provider of providers) {
    try {
      if (!(await provider.isAvailable())) continue;
      return await provider.generate(request);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new ProviderUnavailableError('none');
}
