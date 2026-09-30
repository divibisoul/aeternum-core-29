import test from 'node:test';
import assert from 'node:assert/strict';
import { hortaCore } from '../hortaCore';
import { storeRgoStageInHortaCore } from './RgoHortaCore';

test('RGO stage is persisted in existing HortaCore with immutable key material', () => {
  const result = storeRgoStageInHortaCore({
    stage: 'ARA', scale: 'MICRO', finding_id: 'f1', cycle_id: 'c1',
    parent_stage: 'RGO', parent_hash: 'sha256:p', input_hash: 'sha256:p',
    output_hash: 'sha256:o', status: 'EXECUTED', data: { finding: 'x' },
  });
  const stored = hortaCore.get(result.key) as Record<string, unknown> | undefined;
  assert.equal(result.output_hash, 'sha256:o');
  assert.equal(stored?.output_hash, 'sha256:o');
  assert.equal(stored?.finding_id, 'f1');
});
