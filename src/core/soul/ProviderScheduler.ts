import { generateWithFallback, type CognitiveProvider, type CognitiveRequest, type CognitiveResponse } from './CognitiveProvider';
import { profileBrowserHardware } from './HardwareProfiler';

export interface ProviderScore { id: string; score: number; available: boolean; }

export async function chooseAndGenerate(providers: readonly CognitiveProvider[], request: CognitiveRequest): Promise<CognitiveResponse> {
  const profile = profileBrowserHardware();
  const ordered = [...providers].sort((a, b) => {
    const localBonus = (p: CognitiveProvider) => p.kind === 'local' ? (profile.backend === 'webgpu' ? 3 : 2) : p.kind === 'browser' ? 1 : 0;
    return localBonus(b) - localBonus(a);
  });
  return generateWithFallback(ordered, request);
}
