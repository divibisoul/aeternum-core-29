import fs from 'node:fs';
import path from 'node:path';
import assert from "node:assert/strict";
import { AETERNUM_8_MODULES, validateAeternumModuleGraph } from "../lib/aeternum/AeternumModuleMap.ts";
import { authorityForModule, resolveFunctionalAuthority } from "../lib/aeternum/AeternumFunctionalAuthority.ts";

const graphProblems = validateAeternumModuleGraph();
assert.deepEqual(graphProblems, []);
assert.equal(AETERNUM_8_MODULES.length, 8);

const records = resolveFunctionalAuthority();
assert.equal(records.length, 8);

const m1 = authorityForModule("M1_CORE");
assert.ok(m1.directDependents.includes("M2_ORCHESTRATION"));
assert.ok(m1.directDependents.includes("M5_PERCEPTION"));
assert.ok(m1.transitiveDependents.includes("M8_GOVERNANCE_MEMORY"));
assert.ok(m1.roles.includes("ANCHOR"));
assert.ok(m1.connectionScore > authorityForModule("M3_LANGUAGE").connectionScore);

const m6 = authorityForModule("M6_IMMUNITY");
assert.equal(m6.governanceAuthority, "SARA");
assert.ok(m6.roles.includes("GOVERNOR"));
assert.ok(m6.directDependents.includes("M7_EVOLUTION"));
assert.ok(m6.directDependents.includes("M8_GOVERNANCE_MEMORY"));

const m3 = authorityForModule("M3_LANGUAGE");
assert.deepEqual(m3.authorityPath, ["M1_CORE", "M2_ORCHESTRATION", "M3_LANGUAGE"]);
assert.equal(authorityForModule("M8_GOVERNANCE_MEMORY").executionOwner, "N07");

console.log(JSON.stringify({
  check: "aeternum-functional-authority",
  status: "PASS",
  moduleCount: AETERNUM_8_MODULES.length,
  anchor: m1.moduleId,
  anchorScore: m1.connectionScore,
  m6Governance: m6.governanceAuthority,
}));

const snapshotPath = path.join(process.cwd(), 'docs', 'aeternum-functional-authority.snapshot.json');
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
if (snapshot.schemaVersion !== '1.0.0' || snapshot.system !== 'SOUL' || snapshot.layer !== 'AETERNUM') throw new Error('AETERNUM_AUTHORITY_SNAPSHOT_HEADER_INVALID');
const expected = new Map(records.map((record) => [record.moduleId, record]));
if (!Array.isArray(snapshot.modules) || snapshot.modules.length !== records.length) throw new Error('AETERNUM_AUTHORITY_SNAPSHOT_COUNT_MISMATCH');
for (const item of snapshot.modules) {
  const live = expected.get(item.moduleId);
  if (!live) throw new Error('AETERNUM_AUTHORITY_SNAPSHOT_UNKNOWN_MODULE:' + item.moduleId);
  if (item.executionOwner !== live.executionOwner || item.governanceAuthority !== live.governanceAuthority || item.connectionScore !== live.connectionScore) {
    throw new Error('AETERNUM_AUTHORITY_SNAPSHOT_DIVERGED:' + item.moduleId);
  }
  if (JSON.stringify(item.directDependencies) !== JSON.stringify(live.directDependencies)) throw new Error('AETERNUM_AUTHORITY_SNAPSHOT_DEPENDENCIES_DIVERGED:' + item.moduleId);
  if (JSON.stringify(item.directDependents) !== JSON.stringify(live.directDependents)) throw new Error('AETERNUM_AUTHORITY_SNAPSHOT_DEPENDENTS_DIVERGED:' + item.moduleId);
  if (JSON.stringify(item.transitiveDependents) !== JSON.stringify(live.transitiveDependents)) throw new Error('AETERNUM_AUTHORITY_SNAPSHOT_TRANSITIVE_DIVERGED:' + item.moduleId);
}
console.log(JSON.stringify({snapshot: 'CONSISTENT_WITH_LIVE_RESOLVER', source: snapshot.source, modules: snapshot.modules.length}));
