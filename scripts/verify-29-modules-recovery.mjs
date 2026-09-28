import assert from 'node:assert/strict';
import fs from 'node:fs';

const expected = [
  'acai','mpvs','multimodal_cortex','autonomous_embodiment','neural_forge','asc',
  'biomolecular_designer','reality_synthesis','strategic_planning','csae','dcrs',
  'adaptation_module','scre','ecas','eus','mlfg','emergent_cognition','bnc_v2',
  'skill_acquisition','uci','ethical_governance','strategic_defense',
  'existential_safety','einstein_reasoning','einstein_code','einstein_quantum',
  'cot_arhd','cot_drc','cot_area'
];

const doc = fs.readFileSync('docs/29-MODULES-RECOVERY.md','utf8');
const missing = expected.filter(id => !doc.includes('| ' + id + ' |'));
assert.deepEqual(missing, []);
assert.equal(expected.length, 29);

const statuses = {
  NOT_FOUND_ANYWHERE: (doc.match(/\| NOT_FOUND_ANYWHERE \|/g) || []).length,
  FOUND_IN_BRANCH: (doc.match(/\| FOUND_IN_BRANCH \|/g) || []).length,
  FOUND_IN_HISTORY: (doc.match(/\| FOUND_IN_HISTORY \|/g) || []).length,
  INACTIVE: (doc.match(/\| INACTIVE \|/g) || []).length,
};
assert.deepEqual(statuses, {
  NOT_FOUND_ANYWHERE: 21,
  FOUND_IN_BRANCH: 6,
  FOUND_IN_HISTORY: 1,
  INACTIVE: 1,
});

console.log(JSON.stringify({ status:'PASS', totalModules:29, statuses }, null, 2));
