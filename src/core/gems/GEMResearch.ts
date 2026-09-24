/**
 * GEM-Research: Módulo Ativo de Pesquisa Autônoma
 *
 * The module owns the research queue and result bookkeeping. It does not
 * fabricate sources or confidence. A real provider must be registered.
 */
import { EventBus } from '@/core/EventBus';

export interface ResearchTask {
  id: string;
  query: string;
  status: 'queued' | 'researching' | 'verifying' | 'complete' | 'failed';
  result?: string;
  sources: string[];
  confidence: number | null;
  timestamp: number;
  errorCode?: string;
}

export interface ResearchProviderResult {
  result: string;
  sources: string[];
  confidence: number;
}

export type ResearchProvider = (query: string) => Promise<ResearchProviderResult>;

export interface ResearchMetrics {
  tasksCompleted: number;
  tasksQueued: number;
  avgConfidence: number | null;
  totalSources: number;
  cyclesCompleted: number;
  isRunning: boolean;
  lastResearch: number;
  providerConfigured: boolean;
}

export class GEMResearch {
  private _running = false;
  private _interval: ReturnType<typeof setInterval> | null = null;
  private _queue: ResearchTask[] = [];
  private _completed: ResearchTask[] = [];
  private _cyclesCompleted = 0;
  private _provider: ResearchProvider | null = null;

  get isRunning() { return this._running; }
  get providerConfigured() { return this._provider !== null; }

  registerProvider(provider: ResearchProvider): void {
    if (typeof provider !== 'function') throw new Error('RESEARCH_PROVIDER_INVALID');
    this._provider = provider;
    EventBus.emit('module:registered', { id: 'gem-research-provider', name: 'GEMResearch provider' });
  }

  clearProvider(): void {
    this._provider = null;
  }

  start(intervalMs = 10000): void {
    if (this._running) return;
    this._running = true;
    this._interval = setInterval(() => this.cycle(), intervalMs);
    this.cycle();
  }

  stop(): void {
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
    this._running = false;
  }

  enqueue(query: string): string {
    const normalized = query.trim();
    if (!normalized) throw new Error('RESEARCH_QUERY_REQUIRED');
    const id = `res_${Date.now()}_${this._queue.length}`;
    const task: ResearchTask = {
      id, query: normalized, status: 'queued', sources: [], confidence: null, timestamp: Date.now(),
    };
    this._queue.push(task);
    return task.id;
  }

  async processQuery(query: string): Promise<ResearchTask> {
    const normalized = query.trim();
    if (!normalized) throw new Error('RESEARCH_QUERY_REQUIRED');
    const task: ResearchTask = {
      id: `res_${Date.now()}_${this._completed.length}`,
      query: normalized,
      status: 'researching',
      sources: [],
      confidence: null,
      timestamp: Date.now(),
    };

    const provider = this._provider;
    try {
      if (!provider) throw new Error('RESEARCH_PROVIDER_UNAVAILABLE');
      const data = await provider(normalized);
      if (!data || typeof data.result !== 'string' || !data.result.trim()) throw new Error('RESEARCH_EMPTY_RESULT');
      if (!Array.isArray(data.sources) || data.sources.length === 0) throw new Error('RESEARCH_SOURCES_REQUIRED');
      if (!Number.isFinite(data.confidence) || data.confidence < 0 || data.confidence > 1) throw new Error('RESEARCH_CONFIDENCE_INVALID');
      task.status = 'verifying';
      task.result = data.result;
      task.sources = data.sources.filter(source => typeof source === 'string' && source.trim());
      task.confidence = data.confidence;
      if (task.sources.length === 0) throw new Error('RESEARCH_SOURCES_REQUIRED');
      task.status = 'complete';
    } catch (error) {
      task.status = 'failed';
      task.errorCode = error instanceof Error ? error.message : 'RESEARCH_FAILED';
      task.confidence = null;
    }

    this._completed.push(task);
    if (this._completed.length > 100) this._completed.shift();
    return task;
  }

  private cycle(): void {
    this._cyclesCompleted++;
    const next = this._queue.find(t => t.status === 'queued');
    if (!next) return;
    next.status = 'researching';
    void this.processQuery(next.query).then(() => {
      const idx = this._queue.findIndex(t => t.id === next.id);
      if (idx >= 0) this._queue.splice(idx, 1);
    });
  }

  getMetrics(): ResearchMetrics {
    const completedConfidences = this._completed
      .map(t => t.confidence)
      .filter((c): c is number => c !== null && Number.isFinite(c));
    return {
      tasksCompleted: this._completed.filter(t => t.status === 'complete').length,
      tasksQueued: this._queue.length,
      avgConfidence: completedConfidences.length > 0 ? completedConfidences.reduce((a, b) => a + b, 0) / completedConfidences.length : null,
      totalSources: this._completed.reduce((sum, t) => sum + t.sources.length, 0),
      cyclesCompleted: this._cyclesCompleted,
      isRunning: this._running,
      lastResearch: this._completed.length > 0 ? this._completed[this._completed.length - 1].timestamp : 0,
      providerConfigured: this.providerConfigured,
    };
  }

  getCompletedTasks(): ResearchTask[] {
    return [...this._completed].reverse().slice(0, 20);
  }
}
