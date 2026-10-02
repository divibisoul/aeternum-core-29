export const N01_RESIDENT_AGENT = Object.freeze({
  id: 'N01.resident',
  name: 'Agent-Clareira Gateway Steward',
  nucleus: 'N01',
  version: '1.0.0',
  role: 'host-reference-gateway',
  executionMode: 'embedded-local-worker',
  lifecycle: 'BOUND',
  repositoryWrite: false,
  superpowers: {
    revision: '8ca22dba9a94f28898bbce59f2537ff4d87c747d',
    mode: 'development-methodology-and-skill-pack',
    runtimePolicyEngine: false,
  },
  skills: ['systematic-debugging','verification-before-completion','requesting-code-review'],
  publishedCapabilities: ['mesh.health','mesh.discovery','mesh.resident.describe@1.0.0','clareira.ingest','clareira.metrics','mesh.capability.resolve'],
  authority: 'N01 owns the canonical gateway/Clareira boundary; it does not become the federation control plane.',
  evidence: 'soul-evidence/1',
});
export function describeN01ResidentAgent() { return N01_RESIDENT_AGENT; }
