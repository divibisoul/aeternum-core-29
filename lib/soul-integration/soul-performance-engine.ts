import { scheduleParallel } from './soul-cognitive-signature';

export interface SoulPerformanceSnapshot {
  activeTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalLatencyMs: number;
  averageLatencyMs: number;
  concurrency: number;
}

/**
 * Runtime-level performance engine for the Soul fabric.
 *
 * It accelerates work by improving routing, concurrency and measurement. It
 * intentionally does not claim to overclock or magically increase hardware
 * resources of the Android host.
 */
export class SoulPerformanceEngine {
  private activeTasks = 0;
  private completedTasks = 0;
  private failedTasks = 0;
  private totalLatencyMs = 0;

  async run<T>(task: () => Promise<T>): Promise<T> {
    this.activeTasks += 1;
    const startedAt = Date.now();
    try {
      const result = await task();
      this.completedTasks += 1;
      this.totalLatencyMs += Date.now() - startedAt;
      return result;
    } catch (error) {
      this.failedTasks += 1;
      this.totalLatencyMs += Date.now() - startedAt;
      throw error;
    } finally {
      this.activeTasks -= 1;
    }
  }

  async runParallel<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    return scheduleParallel(tasks.map((task) => () => this.run(task)), true);
  }

  snapshot(): SoulPerformanceSnapshot {
    const completed = this.completedTasks + this.failedTasks;
    return {
      activeTasks: this.activeTasks,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      totalLatencyMs: this.totalLatencyMs,
      averageLatencyMs: completed === 0 ? 0 : this.totalLatencyMs / completed,
      concurrency: this.activeTasks,
    };
  }
}
