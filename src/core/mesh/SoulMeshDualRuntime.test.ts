import { execFileSync } from 'node:child_process';
import test from 'node:test';

test('dual Mesh runtimes agree on the canonical 1.1.0 contract', () => {
  const output = execFileSync(
    process.execPath,
    ['scripts/soul-mesh-dual-runtime-contract-check.mjs'],
    { encoding: 'utf8' },
  );
  if (!output.includes('SOUL_MESH_DUAL_RUNTIME_CONTRACT: ok=true')) {
    throw new Error(output);
  }
});
