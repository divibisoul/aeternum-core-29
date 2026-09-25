import type { SoulNucleus } from './SoulMeshProtocol';

export type SoulMeshEnvironmentConfig = {
  nucleus: SoulNucleus;
  peers: Partial<Record<SoulNucleus, string>>;
  requestTimeoutMs: number;
  maxRetries: number;
};

const NUCLEI = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07'] as const;

/** Vite-safe public topology configuration. Secrets are deliberately excluded from browser env. */
export function loadSoulMeshEnvironment(env: Record<string, string | undefined> = import.meta.env): SoulMeshEnvironmentConfig {
  const nucleus = env.VITE_SOUL_NUCLEUS as SoulNucleus | undefined;
  if (!nucleus || !NUCLEI.includes(nucleus)) throw new Error('VITE_SOUL_NUCLEUS must be N01..N06');

  const peers: Partial<Record<SoulNucleus, string>> = {};
  for (const peer of NUCLEI) {
    if (peer !== nucleus) {
      const url = env[`VITE_${peer}_URL`];
      if (url) peers[peer] = url.replace(/\/$/, '');
    }
  }

  const timeout = Number(env.VITE_MESH_REQUEST_TIMEOUT_MS ?? 15000);
  const retries = Number(env.VITE_MESH_MAX_RETRIES ?? 2);
  return {
    nucleus,
    peers,
    requestTimeoutMs: Number.isFinite(timeout) ? Math.max(1000, timeout) : 15000,
    maxRetries: Number.isFinite(retries) ? Math.min(3, Math.max(0, Math.floor(retries))) : 2,
  };
}
