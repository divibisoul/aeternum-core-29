/**
 * GEM-Research: Módulo Ativo de Pesquisa Autônoma
 * 
 * Loop contínuo de primeiro plano que:
 * - Mantém fila de tópicos de pesquisa
 * - Processa pesquisas via AI gateway
 * - Verifica informações com múltiplas fontes
 * - Alimenta a base de conhecimento continuamente
 */

import { EventBus } from '@/core/EventBus';

export interface ResearchTask {
  id: string;
  query: string;
  status: 'queued' | 'researching' | 'verifying' | 'complete' | 'failed' | 'EXECUTION_REQUIRED';
  result?: string;
  sources: string[];
  confidence: number;
  confidenceMeasured: boolean;
  timestamp: number;
  evidenceStatus: 'UNMEASURED' | 'OBSERVED';
  error?: string;
}

export type ResearchProvider = (query: string) => Promise<{
  result: string;
  sources: string[];
  confidence?: number;
}>;

export interface ResearchMetrics {
  tasksCompleted: number;
  tasksQueued: number;
  avgConfidence: number;
  observedConfidenceSamples: number;
  totalSources: number;
  cyclesCompleted: number;
  isRunning: boolean;
  lastResearch: number;
}

export class GEMResearch {
  private _running = false;
  private _interval: ReturnType<typeof setInterval> | null = null;
  private _queue: ResearchTask[] = [];
  private _completed: ResearchTask[] = [];
  private _cyclesCompleted = 0;
  private _provider: ResearchProvider | null = null;

  get isRunning() { return this._running; }

  setResearchProvider(provider: ResearchProvider | null): void {
    this._provider = provider;
  }

  start(intervalMs = 10000): void {
    if (this._running) return;
    this._running = true;
    console.log('[GEM-Research] Iniciando pesquisa autônoma contínua');
    this._interval = setInterval(() => this.cycle(), intervalMs);
  }

  stop(): void {
    if (this._interval) clearInterval(this._interval);
    this._interval = null;
    this._running = false;
  }

  /**
   * Add a research task to the queue
   */
  enqueue(query: string): string {
    const task: ResearchTask = {
      id: `res_${Date.now()}_${crypto.randomUUID()}`,
      query,
      status: 'queued',
      sources: [],
      confidence: 0,
      confidenceMeasured: false,
      evidenceStatus: 'UNMEASURED',
      timestamp: Date.now(),
    };
    this._queue.push(task);
    return task.id;
  }

  /**
   * Process a research query through AI (called from ChatEngine or autonomously)
   */
  async processQuery(query: string): Promise<ResearchTask> {
    const task: ResearchTask = {
      id: `res_${Date.now()}_${crypto.randomUUID()}`,
      query,
      status: 'researching',
      sources: [],
      confidence: 0,
      confidenceMeasured: false,
      evidenceStatus: 'UNMEASURED',
      timestamp: Date.now(),
    };

    try {
      if (!this._provider) {
        task.status = 'EXECUTION_REQUIRED';
        task.error = 'RESEARCH_PROVIDER_NOT_CONFIGURED';
      } else {
        task.status = 'verifying';
        const observed = await this._provider(query);
        if (!observed.result.trim() || observed.sources.length === 0) {
          task.status = 'failed';
          task.error = 'RESEARCH_PROVIDER_RETURNED_NO_EVIDENCE';
        } else {
          task.result = observed.result;
          task.sources = [...observed.sources];
          if (observed.confidence != null && Number.isFinite(observed.confidence)) {
            task.confidence = Math.max(0, Math.min(1, observed.confidence));
            task.confidenceMeasured = true;
            task.evidenceStatus = 'OBSERVED';
          }
          task.status = 'complete';
        }
      }
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : String(error);
    }

    this._completed.push(task);
    if (this._completed.length > 100) this._completed.shift();
    return task;
  }

  private cycle(): void {
    this._cyclesCompleted++;

    // Process queued tasks
    const next = this._queue.find(t => t.status === 'queued');
    if (next) {
      next.status = 'researching';
      this.processQuery(next.query).then(result => {
        const idx = this._queue.findIndex(t => t.id === next.id);
        if (idx >= 0) this._queue.splice(idx, 1);
      });
    }
  }

  getMetrics(): ResearchMetrics {
    const completedConfidences = this._completed.map(t => t.confidence).filter(c => c > 0);
    return {
      tasksCompleted: this._completed.length,
      tasksQueued: this._queue.length,
      avgConfidence: completedConfidences.length > 0
        ? completedConfidences.reduce((a, b) => a + b, 0) / completedConfidences.length
        : 0,
      observedConfidenceSamples: completedConfidences.length,
      totalSources: this._completed.reduce((sum, t) => sum + t.sources.length, 0),
      cyclesCompleted: this._cyclesCompleted,
      isRunning: this._running,
      lastResearch: this._completed.length > 0 ? this._completed[this._completed.length - 1].timestamp : 0,
    };
  }

  getCompletedTasks(): ResearchTask[] {
    return [...this._completed].reverse().slice(0, 20);
  }
}
