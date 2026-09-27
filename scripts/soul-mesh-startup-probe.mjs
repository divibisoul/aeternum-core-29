import { spawnSync } from 'node:child_process';

const modules = [
  'scripts/soul-supergpu.mjs',
  'scripts/supabase-vector-memory.mjs',
  'scripts/n01-cognitive-delegation.mjs',
  'scripts/sara-federation.mjs',
  'scripts/n01-byok-gemini.mjs',
  'scripts/soul-mesh-server.mjs',
];

for (const [index, modulePath] of modules.entries()) {
  const port = String(18181 + index);
  const code = [
    `import('./${modulePath}')`,
    `.then(() => setTimeout(() => process.exit(0), 300))`,
    `.catch((error) => { console.error(error?.stack || error); process.exit(1); });`,
  ].join('');
  const result = spawnSync(process.execPath, ['--input-type=module', '--eval', code], {
    cwd: process.cwd(),
    env: { ...process.env, SOUL_MESH_N01_PORT: port, SOUL_MESH_N01_HOST: '127.0.0.1' },
    encoding: 'utf8',
    timeout: 5_000,
    maxBuffer: 1_000_000,
  });
  const stdout = String(result.stdout || '').trim();
  const stderr = String(result.stderr || '').trim();
  if (result.error) {
    throw new Error(`N01_STARTUP_PROBE_FAILED:${modulePath}:code=${result.status}:signal=${result.signal || 'none'}:error=${result.error.message}:stdout=${stdout}:stderr=${stderr}`);
  }
  if (result.status !== 0) {
    throw new Error(`N01_STARTUP_PROBE_FAILED:${modulePath}:code=${result.status}:signal=${result.signal || 'none'}:stdout=${stdout}:stderr=${stderr}`);
  }
  console.log(JSON.stringify({ modulePath, ok: true, stdout, stderr }));
}
