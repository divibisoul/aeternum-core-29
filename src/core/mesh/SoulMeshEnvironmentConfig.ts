export type SoulMeshNucleus = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';

export type SoulMeshEnvironmentConfig = {
  nucleus: SoulMeshNucleus;
  peers: Partial<Record<SoulMeshNucleus, string>>;
  token?: string;
  requestTimeoutMs: number;
  maxRetries: number;
};

const nuclei = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06'] as const;

export function loadSoulMeshEnvironment(env: Record<string, string | undefined> = process.env): SoulMeshEnvironmentConfig {
  const nucleus = env.SOUL_NUCLEUS as SoulMeshNucleus | undefined;
  if (!nucleus || !nuclei.includes(nucleus)) throw new Error('SOUL_NUCLEUS must be one of N01..N06');

  const peers: Partial<Record<SoulMeshNucleus, string>> = {};
  for (const peer of nuclei) {
    if (peer !== nucleus && env[`${peer}_URL`]) peers[peer] = env[`${peer}_URL`];
  }

  return {
    nucleus,
    peers,
    token: env.MESH_SHARED_SECRET,
    requestTimeoutMs: Number(env.MESH_REQUEST_TIMEOUT_MS ?? 15000),
    maxRetries: Math.min(3, Math.max(0, Number(env.MESH_MAX_RETRIES ?? 2))),
  };
}
