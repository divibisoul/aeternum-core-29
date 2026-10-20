import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { delegateN01ExternalCapability } from './RecoveredAeternumExternalCapabilityBridge.ts';

// Preserve the original function-boundary test from main. The bridge now
// rejects a malformed/missing link after accepting an omitted correlation ID.
test('N01 external capability bridge validates the local function boundary', async () => {
  await assert.rejects(
    delegateN01ExternalCapability({} as never, { capability: 'strategic_planning' }),
    /Cannot read properties|requestN02/,
  );
});

test('N01 external capability bridge preserves explicit caller correlation over real HTTP', () => {
  const result = spawnSync(process.execPath, [
    'scripts/soul-mesh-correlation-continuity-check.mjs',
    '--bridge',
  ], { encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, `stdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  assert.match(result.stdout, /SOUL_MESH_CORRELATION_BRIDGE_PASS/);
});
