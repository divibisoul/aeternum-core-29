import test from 'node:test';
import assert from 'node:assert/strict';
import { delegateN01ExternalCapability } from './RecoveredAeternumExternalCapabilityBridge';

test('N01 external capability bridge requires caller correlation', async () => {
  const link = {
    requestN02: async () => ({ payload: {} }),
  };
  await assert.rejects(
    delegateN01ExternalCapability(link as never, {
      capability: 'strategic_planning',
      correlationId: ' ',
    }),
    /N01_EXTERNAL_CORRELATION_REQUIRED/,
  );
});

test('N01 external capability bridge preserves caller correlation through N01↔N02', async () => {
  let observedCorrelation = '';
  let observedCapability = '';
  const link = {
    requestN02: async (capability: string, _payload: unknown, correlationId?: string) => {
      observedCapability = capability;
      observedCorrelation = correlationId ?? '';
      return { payload: { ok: true } };
    },
  };

  const result = await delegateN01ExternalCapability(link as never, {
    capability: 'strategic_planning',
    correlationId: 'corr-n01-n02-001',
    workloads: [{ id: 'work-1', cost: 1 }],
    candidate: { capability: 'strategic_planning', utility: 0.8 },
  });

  assert.deepEqual(result, { ok: true });
  assert.equal(observedCapability, 'strategic_planning');
  assert.equal(observedCorrelation, 'corr-n01-n02-001');
});
