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
  status: 'queued' | 'researching' | 'verifying' | 'complete' | 'failed';
  result?: string;
  sources: string[];
  confidence: number;
  timestamp: number;
  error?: string;
  provenance?: 'research-adapter';
}

export interface ResearchMetrics {
  tasksCompleted: number;
  tasksQueued: number;
  avgConfidence: number;
  totalSources: number;
  cyclesCompleted: number;
  isRunning: boolean;
  lastResearch: number;
}

export type ResearchExecutor = (query: string) => Promise<{ result: string; sources: string[]; confidence: number }>;

export class GEMResearch {
  private _running = false;
  private _executor: ResearchExecutor | null = null;
  private _interval: ReturnType<typeof setInterval> | null = null;
  private _queue: ResearchTask[] = [];
  private _completed: ResearchTask[] = [];
  private _cyclesCompleted = 0;

  get isRunning() { return this._running; }

  setExecutor(executor: ResearchExecutor | null): void { this._executor = executor; }

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
      id: globalThis.crypto?.randomUUID?.() ?? `res_${Date.now()}_${this._queue.length + 1}`,
      query,
      status: 'queued',
      sources: [],
      confidence: 0,
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
      id: `res_${Date.now()}`,
      query,
      status: 'researching',
      sources: [],
      confidence: 0,
      timestamp: Date.now(),
    };

    try {
      if (!this._executor) {
        task.status = 'failed';
        task.error = 'RESEARCH_BACKEND_NOT_CONFIGURED';
        this._completed.push(task);
        return task;
      }
      const evidence = await this._executor(query);
      if (!evidence || typeof evidence.result !== 'string' || !Array.isArray(evidence.sources) || !Number.isFinite(evidence.confidence) || evidence.confidence < 0 || evidence.confidence > 1) {
        throw new Error('INVALID_RESEARCH_ADAPTER_RESULT');
      }
      task.status = 'verifying';
      task.result = evidence.result;
      task.sources = evidence.sources.map(String).filter(Boolean);
      task.confidence = evidence.confidence;
      task.provenance = 'research-adapter';
      task.status = 'complete';
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