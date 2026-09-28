/**
 * NeuralManagementCore
 *
 * Núcleo aditivo de gerenciamento + processamento neural.
 * Compõe os mecanismos já existentes no N01 em vez de substituí-los:
 * PrecisionEngine (processamento), ResourceManager (recursos) e
 * RecursiveNeuralLattice (execução neural local).
 */
import { EventBus } from '../EventBus';
import { PrecisionEngine } from '../PrecisionEngine';
import { RecursiveNeuralLattice, type LatticeMetrics } from './RecursiveNeuralLattice';
import { ResourceManager, type ResourceMetrics } from './ResourceManager';

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

  /**
   * Processa mantendo o pipeline histórico do PrecisionEngine e conectando
   * a saída ao runtime neural local para que ambos compartilhem identidade,
   * métricas e gerenciamento de recursos.
   */
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
    let neuralOutput = this.neuralLattice.processInput(padded);

    const elapsed = performance.now() - started;
    this.resourceManager.recordExecution(this.name, elapsed);
    EventBus.emit('neural-management:processed', {
      requestId: request.id,
      processingTimeMs: elapsed,
      neuralOutputSize: neuralOutput.length,
    });

    return { request, neuralOutput };
  }

  getStatus(): NeuralManagementStatus {
    return {
      name: this.name,
      version: this.version,
      connected: true,
      processing: PrecisionEngine.getStats(),
      neural: this.neuralLattice.getMetrics(),
      resources: this.resourceManager.getMetrics(),
    };
  }
}
