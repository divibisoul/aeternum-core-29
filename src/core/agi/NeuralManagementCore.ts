/**
 * NeuralManagementCore
 *
 * Núcleo aditivo de gerenciamento + processamento neural.
 * Compõe mecanismos já existentes no N01 em vez de substituí-los:
 * PrecisionEngine (processamento), ResourceManager (recursos) e
 * RecursiveNeuralLattice (execução neural local).
 */
import { EventBus } from '../EventBus.ts';
import { PrecisionEngine } from '../PrecisionEngine.ts';
import { RecursiveNeuralLattice, type LatticeMetrics } from './RecursiveNeuralLattice.ts';
import { ResourceManager, type ResourceMetrics } from './ResourceManager.ts';

export interface NeuralManagementStatus {
  name: string;
  version: string;
  connected: boolean;
  processing: {
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    codeContextHitRate: number;
    totalSnippetsStored: number;
  };
  neural: LatticeMetrics;
  resources: ResourceMetrics;
}

export class NeuralManagementCore {
  readonly name = 'NeuralManagementCore';
  readonly version = '1.0.0';

  constructor(
    private readonly neuralLattice: RecursiveNeuralLattice,
    private readonly resourceManager: ResourceManager,
  ) {}

  async process(input: string, browserLang = 'pt'): Promise<{
    request: Awaited<ReturnType<typeof PrecisionEngine.process>>;
    neuralOutput: number[];
  }> {
    const started = performance.now();
    const request = await PrecisionEngine.process(input, browserLang);

    const signal = input
      .slice(0, 4)
      .split('')
      .map((char) => char.charCodeAt(0) / 255);
    const padded = Array.from({ length: 4 }, (_, i) => signal[i] ?? 0);
    const neuralOutput = this.neuralLattice.processInput(padded);

    const elapsed = performance.now() - started;
    this.resourceManager.recordExecution(this.name, elapsed);
    void EventBus.emit('neural-management:processed', {
      requestId: request.id,
      processingTimeMs: elapsed,
      neuralOutputSize: neuralOutput.length,
    });

    return { request, neuralOutput };
  }

  processSignal(input: string): number[] {
    const started = performance.now();
    const signal = input
      .slice(0, 4)
      .split('')
      .map((char) => char.charCodeAt(0) / 255);
    const padded = Array.from({ length: 4 }, (_, i) => signal[i] ?? 0);
    const output = this.neuralLattice.processInput(padded);
    this.resourceManager.recordExecution(this.name, performance.now() - started);
    return output;
  }

  getStatus(): NeuralManagementStatus {
    const neural = this.neuralLattice.getMetrics();
    const resources = this.resourceManager.getMetrics();
    const connected = neural.nodeCount > 0 && resources.modulesManaged > 0;

    return {
      name: this.name,
      version: this.version,
      connected,
      processing: PrecisionEngine.getStats(),
      neural,
      resources,
    };
  }
}
