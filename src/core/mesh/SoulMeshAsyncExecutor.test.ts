import assert from 'node:assert/strict';
import { InMemorySoulMeshJobRepository, RepositorySoulMeshJobStore } from './SoulMeshAsyncJobStore.ts';
import { SoulMeshAsyncExecutor } from './SoulMeshAsyncExecutor.ts';

const repository = new InMemorySoulMeshJobRepository();
const store = new RepositorySoulMeshJobStore(repository, 60_000);
let executions = 0;
const executor = new SoulMeshAsyncExecutor(store, {
  async execute(job) {
    executions += 1;
    return { ok: true, capability: job.capability };
  },
});

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
console.log('SoulMeshAsyncExecutor: PASS');
