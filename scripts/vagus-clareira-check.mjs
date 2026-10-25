import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

try {
  const mod = await server.ssrLoadModule('/src/core/neural/ProjetoClareira.ts');
  const { ProjetoClareira } = mod;
  const metrics = ProjetoClareira.getMetrics();
  assert.equal(typeof metrics.vagalTone, 'number');
  assert.equal(typeof metrics.activeVagusBranches, 'number');
  assert.ok(metrics.activeVagusBranches >= 9);
  assert.ok(metrics.redundantVagusBranches >= 9);
  const snapshot = ProjetoClareira.getSnapshot();
  assert.equal(snapshot.vagus.name, 'VagusNerve');
  assert.equal(snapshot.vagus.active, false);
  console.log(JSON.stringify({
    status: 'PASS',
    component: snapshot.vagus.name,
    version: snapshot.vagus.version,
    activeNodeBranches: snapshot.vagus.activeNodeBranches,
    redundantBranches: snapshot.vagus.redundantBranches,
    observedLatencyMs: snapshot.vagus.observedLatencyMs
  }, null, 2));
} finally {
  await server.close();
}
