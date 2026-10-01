import test from 'node:test';
import assert from 'node:assert/strict';
import { delegateN01ExternalCapability } from './RecoveredAeternumExternalCapabilityBridge';

test('N01 external capability bridge validates the local function boundary', async () => {
  await assert.rejects(
    delegateN01ExternalCapability({} as never, { capability: 'strategic_planning' }),
    /Cannot read properties|requestN02/,
  );
});
