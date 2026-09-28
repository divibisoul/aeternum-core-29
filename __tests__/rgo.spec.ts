import { describe, expect, it } from 'vitest';
import { hortaCore } from '../src/core/hortaCore';
import { nervoVago } from '../src/core/eventBus';
import { ingestRgoFindingLocally } from '../src/core/rgo/RgoFinding';

const finding = {
  schema_version: '1.0.0' as const,
  finding_id: 'rgo-test-1',
  object_id: 'object-1',
  timestamp: new Date().toISOString(),
  correlation_id: 'corr-1',
  trace_id: 'trace-1',
  source: { system: 'test', module: 'rgo', version: '1.0.0' },
  epistemic: { mode: 'INSPECTION' as const, verification_state: 'VERIFIED' as const },
  actionability: { status: 'ACTIONABLE' as const },
  failure: { type: 'BUG', description: 'test failure', nature: 'validation' },
  correction_boundary: { problem_to_resolve: 'prevent test failure', required_property: 'validate before use' },
  dual: { status: 'UNRESOLVED' as const },
  evidence: [{ id: 'ev-1', kind: 'test', ref: 'test://rgo' }],
  provenance: { origin: 'test', input_hash: 'sha256:test' },
};
describe('N01 RGO local integration', () => {
  it('writes through existing HortaCore and emits through existing nervoVago facade', () => {
    ingestRgoFindingLocally(finding);
    expect(hortaCore.get('rgo.finding.rgo-test-1')).toBeTruthy();
    expect(nervoVago.getHistory().some(x => x.event === 'soul:mesh:message')).toBe(true);
  });
  it('does not invent a dual without required_property', () => {
    const x = { ...finding, correction_boundary: { problem_to_resolve: 'known', required_property: '' } };
    const out = ingestRgoFindingLocally(x);
    expect(out.dual.status).toBe('UNRESOLVED');
  });
});
