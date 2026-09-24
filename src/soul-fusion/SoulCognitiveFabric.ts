import type { SoulNucleusId } from './SoulNeuralGraph';

export type MemoryKind = 'WORKING' | 'EPISODIC' | 'SEMANTIC' | 'PROCEDURAL';
export type Evidence = { source: string; value: unknown; confidence: number; timestamp: number };
export type AgentDescriptor = { id: string; nucleus: SoulNucleusId; capabilities: readonly string[]; tools: readonly string[]; reliability: number; latencyMs: number; available: boolean; version: string };
export type CapabilityCandidate = AgentDescriptor & { capability: string; score: number };
export type CognitiveObservation = { id: string; nucleus: SoulNucleusId; capability: string; success: boolean; confidence: number; latencyMs: number; timestamp: number; context?: unknown };
export type WorldFact = { subject: string; predicate: string; object: unknown; confidence: number; source: string; timestamp: number };
export type HomeostasisState = { compute: number; memory: number; latency: number; reliability: number; risk: number };
export type MemoryRecord = { id: string; kind: MemoryKind; value: unknown; salience: number; source?: SoulNucleusId; timestamp: number; expiresAt?: number };
export type LearnedPolicy = { attempts: number; successes: number; confidence: number; meanLatencyMs: number; lastUpdated: number };

const NUCLEI: readonly SoulNucleusId[] = ['N01','N02','N03','N04','N05','N06','N07'];
const clamp = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

export class SoulCognitiveFabric {
  private readonly memories = new Map<MemoryKind, Map<string, MemoryRecord>>([
    ['WORKING', new Map()], ['EPISODIC', new Map()], ['SEMANTIC', new Map()], ['PROCEDURAL', new Map()],
  ]);
  private readonly agents = new Map<string, AgentDescriptor>();
  private readonly facts: WorldFact[] = [];
  private readonly observations: CognitiveObservation[] = [];
  private readonly evidence = new Map<string, Evidence[]>();
  private readonly learned = new Map<string, LearnedPolicy>();
  private homeostasis: HomeostasisState = { compute: 1, memory: 1, latency: 1, reliability: 1, risk: 0 };

  remember(id: string, kind: MemoryKind, value: unknown, salience = 0.5, source?: SoulNucleusId, expiresAt?: number): void {
    if (!id.trim()) throw new Error('INVALID_MEMORY_ID');
    const bucket = this.memories.get(kind)!;
    bucket.set(id, { id, kind, value, salience: clamp(salience), source, timestamp: Date.now(), expiresAt });
    this.enforceMemoryLimit(kind, 10000);
  }

  private enforceMemoryLimit(kind: MemoryKind, limit: number): void {
    const bucket = this.memories.get(kind)!;
    if (bucket.size <= limit) return;
    const oldest = [...bucket.values()].sort((a,b) => a.timestamp - b.timestamp).slice(0, bucket.size - limit);
    oldest.forEach((record) => bucket.delete(record.id));
  }

  forgetExpired(now = Date.now()): number {
    let removed = 0;
    this.memories.forEach((bucket) => {
      for (const [id, record] of bucket) if (record.expiresAt !== undefined && record.expiresAt <= now) { bucket.delete(id); removed += 1; }
    });
    return removed;
  }

  recall(kind?: MemoryKind, limit = 20): readonly unknown[] {
    if (!Number.isInteger(limit) || limit < 0) throw new Error('INVALID_MEMORY_LIMIT');
    this.forgetExpired();
    const records = kind ? [...this.memories.get(kind)!.values()] : [...this.memories.values()].flatMap((bucket) => [...bucket.values()]);
    return records.sort((a,b) => (b.salience - a.salience) || (b.timestamp - a.timestamp)).slice(0, limit).map((record) => record.value);
  }

  registerAgent(agent: AgentDescriptor): void {
    if (!agent.id.trim() || !NUCLEI.includes(agent.nucleus) || !agent.version.trim()) throw new Error('INVALID_AGENT_DESCRIPTOR');
    this.agents.set(agent.id, { ...agent, capabilities: [...new Set(agent.capabilities)], tools: [...new Set(agent.tools)], reliability: clamp(agent.reliability), latencyMs: Math.max(0, agent.latencyMs), available: Boolean(agent.available) });
  }

  unregisterAgent(id: string): boolean { return this.agents.delete(id); }

  resolveCapability(capability: string, preferredNucleus?: SoulNucleusId): readonly CapabilityCandidate[] {
    if (!capability.trim()) throw new Error('INVALID_CAPABILITY');
    return [...this.agents.values()].filter((a) => a.available && a.capabilities.includes(capability)).map((a) => {
      const preference = preferredNucleus === a.nucleus ? 0.2 : 0;
      const learned = this.learnedReliability(a.nucleus, capability);
      const latency = 1 / (1 + a.latencyMs / 1000);
      const score = clamp(a.reliability * 0.35 + learned * 0.30 + latency * 0.20 + preference * 0.15);
      return { ...a, capability, score };
    }).sort((a,b) => b.score - a.score);
  }

  addFact(fact: WorldFact): void {
    if (!fact.subject.trim() || !fact.predicate.trim() || !fact.source.trim()) throw new Error('INVALID_WORLD_FACT');
    this.facts.push({ ...fact, confidence: clamp(fact.confidence), timestamp: fact.timestamp || Date.now() });
    if (this.facts.length > 10000) this.facts.splice(0, this.facts.length - 10000);
  }

  queryWorld(subject?: string, predicate?: string): readonly WorldFact[] {
    return this.facts.filter((f) => (!subject || f.subject === subject) && (!predicate || f.predicate === predicate)).slice(-100);
  }

  inferWorld(subject: string, predicate: string): { value?: unknown; confidence: number; sourceCount: number } {
    const matches = this.queryWorld(subject, predicate);
    if (!matches.length) return { confidence: 0, sourceCount: 0 };
    const evidence = matches.map((fact) => ({ source: fact.source, value: fact.object, confidence: fact.confidence, timestamp: fact.timestamp }));
    const result = this.consensusValues(evidence);
    return { value: result.value, confidence: result.confidence, sourceCount: result.sources };
  }

  addEvidence(key: string, item: Evidence): void {
    if (!key.trim() || !item.source.trim()) throw new Error('INVALID_EVIDENCE');
    const list = this.evidence.get(key) ?? [];
    list.push({ ...item, confidence: clamp(item.confidence), timestamp: item.timestamp || Date.now() });
    this.evidence.set(key, list.slice(-100));
  }

  private consensusValues(items: readonly Evidence[]): { value?: unknown; confidence: number; sources: number; conflict: boolean } {
    if (!items.length) return { confidence: 0, sources: 0, conflict: false };
    const buckets = new Map<string, { value: unknown; weight: number; sources: Set<string> }>();
    for (const item of items) {
      const bucketKey = stableValue(item.value);
      const current = buckets.get(bucketKey) ?? { value: item.value, weight: 0, sources: new Set<string>() };
      current.weight += clamp(item.confidence);
      current.sources.add(item.source);
      buckets.set(bucketKey, current);
    }
    const ranked = [...buckets.values()].sort((a,b) => b.weight - a.weight);
    const total = ranked.reduce((sum, item) => sum + item.weight, 0) || 1;
    return { value: ranked[0].value, confidence: clamp(ranked[0].weight / total), sources: new Set(items.map((item) => item.source)).size, conflict: ranked.length > 1 };
  }

  consensus(key: string): { value?: unknown; confidence: number; sources: number; conflict: boolean } { return this.consensusValues(this.evidence.get(key) ?? []); }

  observe(observation: CognitiveObservation): void {
    if (!observation.id.trim() || !NUCLEI.includes(observation.nucleus) || !observation.capability.trim()) throw new Error('INVALID_COGNITIVE_OBSERVATION');
    const normalized = { ...observation, confidence: clamp(observation.confidence), latencyMs: Math.max(0, observation.latencyMs), timestamp: observation.timestamp || Date.now() };
    this.observations.push(normalized);
    if (this.observations.length > 20000) this.observations.splice(0, this.observations.length - 20000);
    const key = `${observation.nucleus}:${observation.capability}`;
    const old = this.learned.get(key) ?? { attempts: 0, successes: 0, confidence: 0.5, meanLatencyMs: 0, lastUpdated: 0 };
    old.attempts += 1;
    if (normalized.success) old.successes += 1;
    const outcome = normalized.success ? normalized.confidence : 0;
    const sample = old.attempts === 1 ? outcome : old.confidence * 0.8 + outcome * 0.2;
    old.confidence = clamp(sample);
    old.meanLatencyMs = old.attempts === 1 ? normalized.latencyMs : old.meanLatencyMs * 0.8 + normalized.latencyMs * 0.2;
    old.lastUpdated = normalized.timestamp;
    this.learned.set(key, old);
  }

  learnedReliability(nucleus: SoulNucleusId, capability: string): number { return this.learned.get(`${nucleus}:${capability}`)?.confidence ?? 0.5; }

  attention(items: readonly { id: string; salience: number; urgency?: number; confidence?: number }[], limit: number): readonly string[] {
    if (!Number.isInteger(limit) || limit < 0) throw new Error('INVALID_ATTENTION_LIMIT');
    return [...items].sort((a,b) => attentionScore(b) - attentionScore(a)).slice(0, limit).map((x) => x.id);
  }

  updateHomeostasis(state: Partial<HomeostasisState>): HomeostasisState {
    this.homeostasis = { ...this.homeostasis, ...state };
    this.homeostasis.compute = clamp(this.homeostasis.compute); this.homeostasis.memory = clamp(this.homeostasis.memory); this.homeostasis.latency = clamp(this.homeostasis.latency); this.homeostasis.reliability = clamp(this.homeostasis.reliability); this.homeostasis.risk = clamp(this.homeostasis.risk);
    return { ...this.homeostasis };
  }

  metacognition(goalConfidence: number, evidenceConfidence: number, conflict: boolean): { confidence: number; shouldAskForHelp: boolean; reason: string } {
    const confidence = clamp(goalConfidence * 0.4 + evidenceConfidence * 0.4 + (conflict ? 0 : 0.2));
    const degraded = this.homeostasis.risk > 0.7 || this.homeostasis.reliability < 0.3 || this.homeostasis.latency < 0.2;
    const shouldAskForHelp = confidence < 0.45 || conflict || degraded;
    return { confidence, shouldAskForHelp, reason: shouldAskForHelp ? 'insufficient-confidence-conflict-or-system-degradation' : 'sufficient-confidence' };
  }

  exportState(): string {
    return JSON.stringify({ memories: [...this.memories.entries()].map(([kind, bucket]) => [kind, [...bucket.values()]]), agents: [...this.agents.values()], facts: this.facts, observations: this.observations, evidence: [...this.evidence.entries()], learned: [...this.learned.entries()], homeostasis: this.homeostasis });
  }

  importState(serialized: string): void {
    const state = JSON.parse(serialized) as { memories?: unknown; agents?: unknown; facts?: unknown; observations?: unknown; evidence?: unknown; learned?: unknown; homeostasis?: Partial<HomeostasisState> };
    if (!state || !Array.isArray(state.memories) || !Array.isArray(state.agents) || !Array.isArray(state.facts) || !Array.isArray(state.observations) || !Array.isArray(state.evidence) || !Array.isArray(state.learned)) throw new Error('INVALID_COGNITIVE_STATE');
    this.memories.forEach((bucket) => bucket.clear());
    for (const entry of state.memories) {
      if (!Array.isArray(entry) || !this.memories.has(entry[0] as MemoryKind) || !Array.isArray(entry[1])) throw new Error('INVALID_MEMORY_STATE');
      for (const record of entry[1] as MemoryRecord[]) this.remember(record.id, record.kind, record.value, record.salience, record.source, record.expiresAt);
    }
    this.agents.clear(); for (const agent of state.agents as AgentDescriptor[]) this.registerAgent(agent);
    this.facts.splice(0); this.facts.push(...(state.facts as WorldFact[]));
    this.observations.splice(0); this.observations.push(...(state.observations as CognitiveObservation[]));
    this.evidence.clear(); for (const entry of state.evidence as [string, Evidence[]][]) this.evidence.set(entry[0], entry[1]);
    this.learned.clear(); for (const entry of state.learned as [string, LearnedPolicy][]) this.learned.set(entry[0], entry[1]);
    if (state.homeostasis) this.updateHomeostasis(state.homeostasis);
  }

  describe(): { memory: number; agents: number; facts: number; observations: number; learnedPolicies: number; homeostasis: HomeostasisState } {
    const memory = [...this.memories.values()].reduce((sum, bucket) => sum + bucket.size, 0);
    return { memory, agents: this.agents.size, facts: this.facts.length, observations: this.observations.length, learnedPolicies: this.learned.size, homeostasis: { ...this.homeostasis } };
  }
}

function stableValue(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableValue).sort().join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${stableValue(object[key])}`).join(',')}}`;
}

function attentionScore(item: { salience: number; urgency?: number; confidence?: number }): number {
  return clamp(item.salience) * 0.45 + clamp(item.urgency ?? 0) * 0.35 + clamp(item.confidence ?? 0.5) * 0.2;
}
