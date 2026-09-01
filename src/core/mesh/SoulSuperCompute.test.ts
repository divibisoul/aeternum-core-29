import assert from 'node:assert/strict';
import test from 'node:test';
import { createSuperComputePlan, executeSuperComputePlan, summarizeSuperCompute } from './SoulSuperCompute';

test('SuperCompute executes independent tasks in the same wave and dependencies in later waves', async () => {
  const starts: string[] = [];
  const plan = createSuperComputePlan([
    { id: 'a', capability: 'N03.audio', target: 'N03', input: 'a' },
    { id: 'b', capability: 'N04.parallel', target: 'N04', input: 'b' },
    { id: 'c', capability: 'N06.support', target: 'N06', input: 'c', dependsOn: ['a', 'b'] },
  ]);

  const results = await executeSuperComputePlan(plan, {
    execute: async (task) => {
      starts.push(task.id);
      await new Promise((resolve) => setTimeout(resolve, task.id === 'a' ? 5 : 1));
      return { task: task.id };
    },
    validate: (_task, output) => Boolean(output && typeof output === 'object' && 'task' in output),
  });

  assert.equal(results.length, 3);
  assert.deepEqual(new Set(starts.slice(0, 2)), new Set(['a', 'b']));
  assert.equal(starts[2], 'c');
  assert.equal(results.every((result) => result.ok), true);
});

test('SuperCompute rejects dependency cycles instead of hanging', async () => {
  const plan = createSuperComputePlan([
    { id: 'a', capability: 'one', target: 'N02', input: null, dependsOn: ['b'] },
    { id: 'b', capability: 'two', target: 'N03', input: null, dependsOn: ['a'] },
  ]);

  await assert.rejects(
    executeSuperComputePlan(plan, { execute: async () => null }),
    /SUPERCOMPUTE_DEPENDENCY_DEADLOCK/,
  );
});

test('SuperCompute summary exposes real execution health', async () => {
  const plan = createSuperComputePlan([
    { id: 'ok', capability: 'one', target: 'N02', input: null },
    { id: 'bad', capability: 'two', target: 'N03', input: null },
  ]);
  const results = await executeSuperComputePlan(plan, {
    execute: async (task) => {
      if (task.id === 'bad') throw new Error('EXPECTED_FAILURE');
      return 'ok';
    },
  });
  const summary = summarizeSuperCompute(results);
  assert.equal(summary.total, 2);
  assert.equal(summary.completed, 1);
  assert.equal(summary.failed, 1);
  assert.equal(summary.successRate, 0.5);
});
