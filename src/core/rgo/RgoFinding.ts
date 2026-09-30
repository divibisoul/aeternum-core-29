import { hortaCore } from '../hortaCore';
import { nervoVago } from '../eventBus';
import { createSoulMeshMessage, type SoulMeshMessage, type SoulNucleus, type SoulMeshTransport } from '../mesh/SoulMeshProtocol';

export type RgoVerification = 'VERIFIED' | 'UNVERIFIED' | 'INCONCLUSIVE';
export type RgoEpistemicMode = 'EXECUTION' | 'INSPECTION' | 'INFERENCE' | 'EXTERNAL';
export type RgoDualStatus = 'DERIVED_FROM_CONTRACT' | 'UNRESOLVED' | 'NOT_APPLICABLE';

export interface RgoEvidenceRef { id: string; kind: string; ref: string; }

export interface RgoFinding {
  schema_version: '1.0.0';
  finding_id: string;
  object_id: string;
  timestamp: string;
  correlation_id: string;
  trace_id: string;
  source: { system: string; module: string; version: string };
  epistemic: { mode: RgoEpistemicMode; verification_state: RgoVerification };
  actionability: { status: 'ACTIONABLE' | 'NON_ACTIONABLE' | 'INFORMATIONAL' | 'DUPLICATE' | 'INCONCLUSIVE' | 'UNDEFINED'; reason?: string };
  failure: { type: string; description: string; nature: string; title?: string; cause?: string; impact?: string };
  correction_boundary: { problem_to_resolve: string; required_property: string };
  dual: { status: RgoDualStatus; property?: string; evidence_refs?: string[] };
  capability?: { id: string; state: 'DERIVED' | 'IMPLEMENTED' | 'TESTED' | 'VALIDATED' | 'PROMOTABLE' | 'PROMOTED' };
  evidence: RgoEvidenceRef[];
  provenance: { origin: string; parent_ids?: string[]; input_hash: string };
}

export function validateRgoFinding(f: RgoFinding): void {
  if (f.schema_version !== '1.0.0') throw new Error('RGO_SCHEMA_VERSION_UNSUPPORTED');
  if (!f.finding_id || !f.object_id || !f.correlation_id || !f.trace_id) throw new Error('RGO_IDENTITY_REQUIRED');
  if (!f.source.system || !f.source.module || !f.source.version) throw new Error('RGO_SOURCE_REQUIRED');
  if (!f.epistemic.mode || !f.epistemic.verification_state) throw new Error('RGO_EPISTEMIC_REQUIRED');
  if (!f.failure.type || !f.failure.description || !f.failure.nature) throw new Error('RGO_FAILURE_REQUIRED');
  if (!f.correction_boundary.problem_to_resolve) throw new Error('RGO_CORRECTION_BOUNDARY_REQUIRED');
  if (!f.evidence.length) throw new Error('RGO_EVIDENCE_REQUIRED');
  if (!f.provenance.origin || !f.provenance.input_hash) throw new Error('RGO_PROVENANCE_REQUIRED');
  if (f.dual.status === 'DERIVED_FROM_CONTRACT' && !f.correction_boundary.required_property) throw new Error('RGO_DUAL_DERIVATION_REQUIRED');
}

export function deriveRgoDual(f: RgoFinding): RgoFinding {
  if (!f.correction_boundary.required_property) return { ...f, dual: { status: 'UNRESOLVED' } };
  return { ...f, dual: { status: 'DERIVED_FROM_CONTRACT', property: f.correction_boundary.required_property, evidence_refs: f.evidence.map(e => e.id) } };
}

export function ingestRgoFindingLocally(finding: RgoFinding): RgoFinding {
  validateRgoFinding(finding);
  const normalized = deriveRgoDual(finding);
  hortaCore.set('rgo.finding.' + normalized.finding_id, normalized);
  nervoVago.emit('soul:mesh:message', { protocol: 'rgo/1', type: 'RGO_FINDING_RECEIVED', finding: normalized });
  return normalized;
}

export function createRgoMeshMessage(source: SoulNucleus, target: SoulNucleus, finding: RgoFinding): SoulMeshMessage<RgoFinding> {
  validateRgoFinding(finding);
  return createSoulMeshMessage({
    source, target, kind: 'event', correlationId: finding.correlation_id, capability: 'rgo.finding.ingest',
    payload: deriveRgoDual(finding), meta: { runtime: 'N01', transport: 'IN_PROCESS', version: '1.0.0', traceId: finding.trace_id },
  });
}

export async function sendRgoFinding(transport: SoulMeshTransport, target: SoulNucleus, finding: RgoFinding): Promise<void> {
  await transport.send(createRgoMeshMessage('N01', target, finding));
}
