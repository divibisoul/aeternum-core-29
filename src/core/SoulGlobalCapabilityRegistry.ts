export type NucleusId = 'N01' | 'N02' | 'N03' | 'N04' | 'N05' | 'N06';
export type CapabilityExecutionProof = 'UNVERIFIED' | 'CONNECTED' | 'EXECUTED' | 'VERIFIED';
export type CapabilityRecord = {
  capability: string;
  owner: NucleusId;
  dependency?: string;
  transports: readonly string[];
  execution: 'local' | 'remote' | 'hybrid';
  proof: CapabilityExecutionProof;
};

/** Global Cockpit registry. It aggregates declarations; it never invents execution proof. */
export class SoulGlobalCapabilityRegistry {
  private readonly records = new Map<string, CapabilityRecord>();

  upsert(record: CapabilityRecord) {
    const key = `${record.owner}:${record.capability}`;
    const previous = this.records.get(key);
    if (previous && record.proof === 'UNVERIFIED' && previous.proof !== 'UNVERIFIED') return previous;
    this.records.set(key, record);
    return record;
  }

  announce(owner: NucleusId, capabilities: readonly string[], dependency?: string) {
    return capabilities.map((capability) => this.upsert({
      capability,
      owner,
      dependency,
      transports: ['WEBVIEW_BRIDGE', 'LOOPBACK_HTTP', 'HTTP', 'REALTIME', 'IN_PROCESS'],
      execution: owner === 'N01' ? 'hybrid' : 'remote',
      proof: 'UNVERIFIED',
    }));
  }

  get(capability: string, owner?: NucleusId) {
    return [...this.records.values()].filter((r) => r.capability === capability && (!owner || r.owner === owner));
  }

  list() { return [...this.records.values()]; }
}
