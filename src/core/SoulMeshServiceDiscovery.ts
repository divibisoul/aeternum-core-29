import type { NucleusId } from './SoulMeshFabricContract';

export type SoulRuntimeEndpoint = {
  nucleus: NucleusId;
  endpoint?: string;
  enabled: boolean;
  transports: readonly ('WEBVIEW_BRIDGE' | 'LOOPBACK_HTTP' | 'HTTP' | 'REALTIME' | 'IN_PROCESS')[];
};

const env = (key: string) => {
  const value = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.[key];
  return value?.trim() || undefined;
};

/** Runtime discovery for the hybrid GPU fabric. No endpoint is hard-coded. */
export function discoverSoulRuntimes(): Record<NucleusId, SoulRuntimeEndpoint> {
  return {
    N01: { nucleus: 'N01', enabled: true, transports: ['IN_PROCESS', 'WEBVIEW_BRIDGE', 'LOOPBACK_HTTP'] },
    N02: { nucleus: 'N02', endpoint: env('VITE_SOUL_N02_ENDPOINT'), enabled: !!env('VITE_SOUL_N02_ENDPOINT'), transports: ['HTTP', 'REALTIME', 'LOOPBACK_HTTP'] },
    N03: { nucleus: 'N03', endpoint: env('VITE_SOUL_N03_ENDPOINT'), enabled: !!env('VITE_SOUL_N03_ENDPOINT'), transports: ['HTTP', 'REALTIME', 'LOOPBACK_HTTP', 'WEBVIEW_BRIDGE'] },
    N04: { nucleus: 'N04', endpoint: env('VITE_SOUL_N04_ENDPOINT'), enabled: !!env('VITE_SOUL_N04_ENDPOINT'), transports: ['HTTP', 'REALTIME', 'LOOPBACK_HTTP'] },
    N05: { nucleus: 'N05', endpoint: env('VITE_SOUL_N05_ENDPOINT'), enabled: !!env('VITE_SOUL_N05_ENDPOINT'), transports: ['HTTP', 'REALTIME', 'LOOPBACK_HTTP'] },
    N06: { nucleus: 'N06', endpoint: env('VITE_SOUL_N06_ENDPOINT'), enabled: !!env('VITE_SOUL_N06_ENDPOINT'), transports: ['HTTP', 'REALTIME', 'LOOPBACK_HTTP', 'WEBVIEW_BRIDGE'] },
  };
}

export function endpointFor(nucleus: NucleusId): SoulRuntimeEndpoint {
  return discoverSoulRuntimes()[nucleus];
}
