import test from 'node:test';
import assert from 'node:assert/strict';
import { hortaCore } from '../src/core/hortaCore';
import { nervoVago } from '../src/core/eventBus';
import { ingestRgoFindingLocally } from '../src/core/rgo/RgoFinding';

const finding = {
  schema_version: '1.0.0' as const,
  finding_id: 'rgo-test-1', object_id: 'object-1', timestamp: new Date().toISOString(),
  correlation_id: 'corr-1', trace_id: 'trace-1',
  source: { system: 'test', module: 'rgo', version: '1.0.0' },
  epistemic: { mode: 'INSPECTION' as const, verification_state: 'VERIFIED' as const },
  actionability: { status: 'ACTIONABLE' as const },
  failure: { type: 'BUG', description: 'test failure', nature: 'validation' },
  correction_boundary: { problem_to_resolve: 'prevent test failure', required_property: 'validate before use' },
  dual: { status: 'UNRESOLVED' as const },
  evidence: [{ id: 'ev-1', kind: 'test', ref: 'test://rgo' }],
  provenance: { origin: 'test', input_hash: 'sha256:test' },
};

test('N01 RGO integrates with existing HortaCore and nervoVago', () => {
  ingestRgoFindingLocally(finding);
  assert.ok(hortaCore.get('rgo.finding.rgo-test-1'));
  assert.ok(nervoVago.getHistory().some(x => x.event === 'soul:mesh:message'));
});
test('N01 RGO does not invent dual without required property', () => {
  const x = { ...finding, correction_boundary: { problem_to_resolve: 'known', required_property: '' } };
  assert.equal(ingestRgoFindingLocally(x).dual.status, 'UNRESOLVED');
});
