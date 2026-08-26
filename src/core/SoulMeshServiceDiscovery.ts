export type NucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';
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
  const endpoints: Record<NucleusId, string | undefined> = {
    N01: undefined,
    N02: env('VITE_SOUL_N02_ENDPOINT'),
    N03: env('VITE_SOUL_N03_ENDPOINT'),
    N04: env('VITE_SOUL_N04_ENDPOINT'),
    N05: env('VITE_SOUL_N05_ENDPOINT'),
    N06: env('VITE_SOUL_N06_ENDPOINT'),
  };
  const transports: Record<NucleusId, SoulRuntimeEndpoint['transports']> = {
    N01: ['IN_PROCESS', 'WEBVIEW_BRIDGE', 'LOOPBACK_HTTP'],
    N02: ['HTTP', 'REALTIME', 'LOOPBACK_HTTP'],
    N03: ['HTTP', 'REALTIME', 'LOOPBACK_HTTP', 'WEBVIEW_BRIDGE'],
    N04: ['HTTP', 'REALTIME', 'LOOPBACK_HTTP'],
    N05: ['HTTP', 'REALTIME', 'LOOPBACK_HTTP'],
    N06: ['HTTP', 'REALTIME', 'LOOPBACK_HTTP', 'WEBVIEW_BRIDGE'],
  };
  return (Object.keys(endpoints) as NucleusId[]).reduce((all, nucleus) => {
    all[nucleus] = { nucleus, endpoint: endpoints[nucleus], enabled: nucleus === 'N01' || !!endpoints[nucleus], transports: transports[nucleus] };
    return all;
  }, {} as Record<NucleusId, SoulRuntimeEndpoint>);
}

export function endpointFor(nucleus: NucleusId): SoulRuntimeEndpoint {
  return discoverSoulRuntimes()[nucleus];
}
