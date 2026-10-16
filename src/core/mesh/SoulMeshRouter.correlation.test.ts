import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('SoulMeshRouter preserves caller correlation over the actual loopback HTTP transport', () => {
  const result = spawnSync(process.execPath, [
    'scripts/soul-mesh-correlation-continuity-check.mjs',
    '--router',
  ], { encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.match(result.stdout, /SOUL_MESH_CORRELATION_ROUTER_PASS/);
});
