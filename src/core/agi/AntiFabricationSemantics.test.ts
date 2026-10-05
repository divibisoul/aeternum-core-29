import assert from 'node:assert/strict';
import { GodelAgent } from './GodelAgent';
import { HyperSafetySystem } from './HyperSafetySystem';
import { ContinuousAuditSystem, MetaGoal } from './ImmutableEthicalCore';
import { NucleoIncertezaProdutiva } from './NucleoIncertezaProdutiva';

const agent = new GodelAgent();
const first = await agent.executeSelfImprovementCycle();
const second = await agent.executeSelfImprovementCycle();
assert.ok(first.length > 0);
assert.ok(second.length > 0);
assert.ok(first.every(item => item.expectedImprovement >= 0 && item.expectedImprovement <= 0.05));
assert.ok(second.every(item => item.expectedImprovement >= 0 && item.expectedImprovement <= 0.05));

const safety = new HyperSafetySystem();
const health = safety.generateReport();
assert.equal(health.observedHealth, false);
assert.deepEqual(health.unmeasuredLayers, ['consciousness','ethics','selfHealing','evolution','lattice']);
assert.equal(health.overallHealth, 0);

const audit = new ContinuousAuditSystem();
const goal: MetaGoal = {id:'test',description:'optimize',priority:0.5,ethicalAlignment:1,userBenefit:1,timestamp:Date.now()};
const metrics = audit.getMetrics();
assert.equal(metrics.observed, false);
assert.equal(metrics.avgScore, 0);
await audit.audit(goal, {type:'optimization_cycle'});
assert.equal(audit.getMetrics().observed, true);

const nipA = new NucleoIncertezaProdutiva();
const nipB = new NucleoIncertezaProdutiva();
const input = 'deterministic forensic input';
const a = nipA.processInput(input);
const b = nipB.processInput(input);
assert.deepEqual(a, b);

console.log('N01_ANTIFABRICATION_SEMANTICS: PASS');
