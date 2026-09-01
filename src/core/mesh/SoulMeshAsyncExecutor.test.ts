import assert from 'node:assert/strict';
import { InMemorySoulMeshJobRepository, RepositorySoulMeshJobStore } from './SoulMeshAsyncJobStore.ts';
import { SoulMeshAsyncExecutor } from './SoulMeshAsyncExecutor.ts';
import { SoulMeshTelemetry } from '../../../lib/soul-mesh/SoulMeshTelemetry.ts';

const repository = new InMemorySoulMeshJobRepository();
const store = new RepositorySoulMeshJobStore(repository, 60_000);
let executions = 0;
const telemetry = new SoulMeshTelemetry('N01');
const events: string[] = [];
const originalLog = console.log;
console.log = (value?: unknown) => {
  if (typeof value === 'string') events.push(value);
};

try {
  const executor = new SoulMeshAsyncExecutor(store, {
    async execute(job) {
      executions += 1;
      return { ok: true, capability: job.capability };
    },
  }, telemetry);

  const job = await store.create({
    correlationId: 'c1', source: 'N01', target: 'N06', capability: 'support.ai-pilot',
    payload: { prompt: 'test' }, expiresAt: Date.now() + 60_000,
  });
  assert.equal(job.status, 'queued');

  const done = await executor.run(job.jobId);
  assert.equal(done?.status, 'completed');
  assert.equal(executions, 1);
  assert.deepEqual(done?.result, { ok: true, capability: 'support.ai-pilot' });

  const secondRun = await executor.run(job.jobId);
  assert.equal(secondRun?.status, 'completed');
  assert.equal(executions, 1);

  assert.equal(events.length, 4);
  const telemetryRecords = events.map((entry) => JSON.parse(entry).soulMesh);
  assert.deepEqual(telemetryRecords.map((record) => record.event), [
    'mesh.job.queued',
    'mesh.capability.started',
    'mesh.capability.completed',
    'mesh.job.completed',
  ]);
  assert.ok(telemetryRecords.every((record) => record.correlationId === 'c1'));
  assert.ok(telemetryRecords.every((record) => record.jobId === job.jobId));
  assert.ok(telemetryRecords.every((record) => !('payload' in record)));

  originalLog('SoulMeshAsyncExecutor: PASS');
} finally {
  console.log = originalLog;
}
