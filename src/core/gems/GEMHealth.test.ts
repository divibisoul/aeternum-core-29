import { strict as assert } from 'node:assert';
import { GEMHealth } from './GEMHealth';

test('GEM-Health does not synthesize physiological readings without wearable data', () => {
  const health = new GEMHealth();
  health.start(60);
  health.stop();
  assert.equal(health.metrics.wearableConnected, false);
  assert.equal(health.metrics.heartRate, null);
  assert.equal(health.metrics.hrv, null);
  assert.equal(health.metrics.stressLevel, null);
  assert.equal(health.metrics.fatigueIndex, null);
});

test('GEM-Health analyzes only ingested wearable samples', () => {
  const health = new GEMHealth();
  health.ingestWearableData({
    heartRate: 130,
    hrv: 15,
    stressLevel: 0.9,
    fatigueIndex: 0.8,
  });
  assert.equal(health.metrics.wearableConnected, true);
  assert.equal(health.metrics.heartRate, 130);
  assert.equal(health.metrics.hrv, 15);
  assert.equal(health.alerts.length >= 3, true);
});
