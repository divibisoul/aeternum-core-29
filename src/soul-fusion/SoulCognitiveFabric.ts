import type { SoulNucleusId } from './SoulNeuralGraph';

export type MemoryKind = 'WORKING' | 'EPISODIC' | 'SEMANTIC' | 'PROCEDURAL';
export type Evidence = { source: string; value: unknown; confidence: number; timestamp: number };
export type AgentDescriptor = { id: string; nucleus: SoulNucleusId; capabilities: readonly string[]; tools: readonly string[]; reliability: number; latencyMs: number; available: boolean; version: string };
export type CapabilityCandidate = AgentDescriptor & { capability: string; score: number };
export type CognitiveObservation = { id: string; nucleus: SoulNucleusId; capability: string; success: boolean; confidence: number; latencyMs: number; timestamp: number; context?: unknown };
export type WorldFact = { subject: string; predicate: string; object: unknown; confidence: number; source: string; timestamp: number };
export type HomeostasisState = { compute: number; memory: number; latency: number; reliability: number; risk: number };

const NUCLEI: readonly SoulNucleusId[] = ['N01','N02','N03','N04','N05','N06'];
const clamp = (v: number) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

export class SoulCognitiveFabric {
  private readonly memories = new Map<string, { kind: MemoryKind; value: unknown; salience: number; source?: SoulNucleusId; timestamp: number }>();
  private readonly agents = new Map<string, AgentDescriptor>();
  private readonly facts: WorldFact[] = [];
  private readonly observations: CognitiveObservation[] = [];
  private readonly evidence = new Map<string, Evidence[]>();
  private readonly learned = new Map<string, { attempts: number; successes: number; confidence: number; meanLatencyMs: number }>();
  private homeostasis: HomeostasisState = { compute: 1, memory: 1, latency: 1, reliability: 1, risk: 0 };

  remember(id: string, kind: MemoryKind, value: unknown, salience = 0.5, source?: SoulNucleusId): void {
    if (!id.trim()) throw new Error('INVALID_MEMORY_ID');
    this.memories.set(id, { kind, value, salience: clamp(salience), source, timestamp: Date.now() });
  }

  recall(kind?: MemoryKind, limit = 20): readonly unknown[] {
    return [...this.memories.values()].filter((m) => !kind || m.kind === kind).sort((a,b) => b.salience - a.salience).slice(0, limit).map((m) => m.value);
  }

  registerAgent(agent: AgentDescriptor): void {
    if (!agent.id.trim() || !NUCLEI.includes(agent.nucleus)) throw new Error('INVALID_AGENT_DESCRIPTOR');
    this.agents.set(agent.id, { ...agent, capabilities: [...new Set(agent.capabilities)], tools: [...new Set(agent.tools)], reliability: clamp(agent.reliability), latencyMs: Math.max(0, agent.latencyMs), available: Boolean(agent.available) });
  }

  resolveCapability(capability: string, preferredNucleus?: SoulNucleusId): readonly CapabilityCandidate[] {
    if (!capability.trim()) throw new Error('INVALID_CAPABILITY');
    return [...this.agents.values()]
      .filter((a) => a.available && a.capabilities.includes(capability))
      .map((a) => {
        const preference = preferredNucleus === a.nucleus ? 0.2 : 0;
        const latency = 1 / (1 + a.latencyMs / 1000);
        const score = clamp(a.reliability * 0.55 + latency * 0.25 + preference * 0.2);
        return { ...a, capability, score };
      }).sort((a,b) => b.score - a.score);
  }

  addFact(fact: WorldFact): void {
    this.facts.push({ ...fact, confidence: clamp(fact.confidence), timestamp: fact.timestamp || Date.now() });
    if (this.facts.length > 10000) this.facts.splice(0, this.facts.length - 10000);
  }

  queryWorld(subject?: string, predicate?: string): readonly WorldFact[] {
    return this.facts.filter((f) => (!subject || f.subject === subject) && (!predicate || f.predicate === predicate)).slice(-100);
  }

  addEvidence(key: string, item: Evidence): void {
    const list = this.evidence.get(key) ?? [];
    list.push({ ...item, confidence: clamp(item.confidence), timestamp: item.timestamp || Date.now() });
    this.evidence.set(key, list.slice(-50));
  }

  consensus(key: string): { value?: unknown; confidence: number; sources: number; conflict: boolean } {
    const items = this.evidence.get(key) ?? [];
    if (!items.length) return { confidence: 0, sources: 0, conflict: false };
    const buckets = new Map<string, { value: unknown; weight: number; count: number }>();
    for (const item of items) {
      const bucket = JSON.stringify(item.value);
      const current = buckets.get(bucket) ?? { value: item.value, weight: 0, count: 0 };
      current.weight += clamp(item.confidence); current.count += 1; buckets.set(bucket, current);
    }
    const ranked = [...buckets.values()].sort((a,b) => b.weight - a.weight);
    const total = ranked.reduce((s,b) => s + b.weight, 0) || 1;
    return { value: ranked[0].value, confidence: clamp(ranked[0].weight / total), sources: items.length, conflict: ranked.length > 1 };
  }

  observe(observation: CognitiveObservation): void {
    this.observations.push({ ...observation, confidence: clamp(observation.confidence), timestamp: observation.timestamp || Date.now() });
    if (this.observations.length > 20000) this.observations.splice(0, this.observations.length - 20000);
    const key = `${observation.nucleus}:${observation.capability}`;
    const old = this.learned.get(key) ?? { attempts: 0, successes: 0, confidence: 0.5, meanLatencyMs: 0 };
    old.attempts += 1;
    if (observation.success) old.successes += 1;
    old.confidence = clamp(old.successes / old.attempts);
    old.meanLatencyMs = old.meanLatencyMs === 0 ? observation.latencyMs : old.meanLatencyMs * 0.8 + observation.latencyMs * 0.2;
    this.learned.set(key, old);
  }

  learnedReliability(nucleus: SoulNucleusId, capability: string): number {
    return this.learned.get(`${nucleus}:${capability}`)?.confidence ?? 0.5;
  }

  attention(items: readonly { id: string; salience: number; urgency?: number; confidence?: number }[], limit: number): readonly string[] {
    return [...items].sort((a,b) => (clamp(b.salience) * 0.45 + clamp(b.urgency ?? 0) * 0.35 + clamp(b.confidence ?? 0.5) * 0.2) - (clamp(a.salience) * 0.45 + clamp(a.urgency ?? 0) * 0.35 + clamp(a.confidence ?? 0.5) * 0.2)).slice(0, Math.max(0, limit)).map((x) => x.id);
  }

  updateHomeostasis(state: Partial<HomeostasisState>): HomeostasisState {
    this.homeostasis = { ...this.homeostasis, ...state };
    this.homeostasis.compute = clamp(this.homeostasis.compute);
    this.homeostasis.memory = clamp(this.homeostasis.memory);
    this.homeostasis.latency = clamp(this.homeostasis.latency);
    this.homeostasis.reliability = clamp(this.homeostasis.reliability);
    this.homeostasis.risk = clamp(this.homeostasis.risk);
    return this.homeostasis;
  }

  metacognition(goalConfidence: number, evidenceConfidence: number, conflict: boolean): { confidence: number; shouldAskForHelp: boolean; reason: string } {
    const confidence = clamp(goalConfidence * 0.4 + evidenceConfidence * 0.4 + (conflict ? 0 : 0.2));
    const shouldAskForHelp = confidence < 0.45 || conflict;
    return { confidence, shouldAskForHelp, reason: shouldAskForHelp ? 'insufficient-confidence-or-conflicting-evidence' : 'sufficient-confidence' };
  }

  describe(): { memory: number; agents: number; facts: number; observations: number; learnedPolicies: number; homeostasis: HomeostasisState } {
    return { memory: this.memories.size, agents: this.agents.size, facts: this.facts.length, observations: this.observations.length, learnedPolicies: this.learned.size, homeostasis: { ...this.homeostasis } };
  }
}
