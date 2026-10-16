import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('N01 external capability bridge requires and preserves caller correlation without a fake transport', () => {
  const result = spawnSync(process.execPath, [
    'scripts/soul-mesh-correlation-continuity-check.mjs',
    '--bridge',
  ], { encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.match(result.stdout, /SOUL_MESH_CORRELATION_BRIDGE_PASS/);
});
