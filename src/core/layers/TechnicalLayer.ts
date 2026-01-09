/**
 * CAMADA TÉCNICA - Core Executável Real
 * 
 * Adaptação de camada_tecnico.py para TypeScript
 * Implementa redes neurais simuladas, aprendizado por reforço e otimizações
 */

import { EventBus } from '../EventBus';

/**
 * AprendizadoReforcoContinuo - Rede Neural para Aprendizado por Reforço
 * 
 * Input: experiencia (Float32Array de dim 10)
 * Output: out (Float32Array de dim 5)
 * Métrica: loss convergence < 0.1 após 10 iters
 */
export class AprendizadoReforcoContinuo {
  private weights1: Float32Array;
  private weights2: Float32Array;
  private bias1: Float32Array;
  private bias2: Float32Array;
  private learningRate = 0.005;
  private lossHistory: number[] = [];

  constructor() {
    // fc1: 10 -> 32
    this.weights1 = this.initializeWeights(10, 32);
    this.bias1 = new Float32Array(32);
    
    // fc2: 32 -> 5
    this.weights2 = this.initializeWeights(32, 5);
    this.bias2 = new Float32Array(5);
    
    EventBus.emit('module:registered', { 
      id: 'aprendizado-reforco', 
      name: 'AprendizadoReforcoContinuo' 
    });
  }

  private initializeWeights(inputDim: number, outputDim: number): Float32Array {
    const weights = new Float32Array(inputDim * outputDim);
    const scale = Math.sqrt(2 / inputDim); // Xavier initialization
    for (let i = 0; i < weights.length; i++) {
      weights[i] = (Math.random() * 2 - 1) * scale;
    }
    return weights;
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private matmul(input: Float32Array, weights: Float32Array, bias: Float32Array, inputDim: number, outputDim: number): Float32Array {
    const output = new Float32Array(outputDim);
    for (let j = 0; j < outputDim; j++) {
      let sum = bias[j];
      for (let i = 0; i < inputDim; i++) {
        sum += input[i] * weights[i * outputDim + j];
      }
      output[j] = sum;
    }
    return output;
  }

  /**
   * Processa experiência através da rede neural
   */
  processar(experiencia: number[] | Float32Array): Float32Array {
    const input = experiencia instanceof Float32Array 
      ? experiencia 
      : new Float32Array(experiencia);
    
    // Forward pass
    const hidden = this.matmul(input, this.weights1, this.bias1, 10, 32);
    for (let i = 0; i < hidden.length; i++) {
      hidden[i] = this.relu(hidden[i]);
    }
    
    const output = this.matmul(hidden, this.weights2, this.bias2, 32, 5);
    
    // Calcular reward e loss
    const rewardSim = output.reduce((a, b) => a + b, 0);
    const loss = -rewardSim;
    this.lossHistory.push(loss);
    
    // Backpropagation simplificada (gradient descent)
    this.updateWeights(input, hidden, output);
    
    console.log(`[AprendizadoReforco] Loss: ${loss.toFixed(4)}, Convergência: ${this.isConverged()}`);
    
    return output;
  }

  private updateWeights(input: Float32Array, hidden: Float32Array, output: Float32Array): void {
    // Simplified gradient update
    const gradient = -1; // d(loss)/d(sum) = -1
    
    // Update weights2
    for (let i = 0; i < 32; i++) {
      for (let j = 0; j < 5; j++) {
        this.weights2[i * 5 + j] -= this.learningRate * gradient * hidden[i];
      }
    }
    
    // Update bias2
    for (let j = 0; j < 5; j++) {
      this.bias2[j] -= this.learningRate * gradient;
    }
  }

  isConverged(): boolean {
    if (this.lossHistory.length < 10) return false;
    const recentLosses = this.lossHistory.slice(-10);
    const avgLoss = recentLosses.reduce((a, b) => a + b, 0) / 10;
    return Math.abs(avgLoss) < 0.1;
  }

  getMetrics(): { avgLoss: number; iterations: number; converged: boolean } {
    const avgLoss = this.lossHistory.length > 0 
      ? this.lossHistory.reduce((a, b) => a + b, 0) / this.lossHistory.length 
      : 0;
    return {
      avgLoss,
      iterations: this.lossHistory.length,
      converged: this.isConverged(),
    };
  }
}

/**
 * SupervisionadoEvolutivo - Aprendizado Supervisionado com Evolução
 * 
 * Input: dados (array de exemplos), labels (array de rótulos)
 * Output: modelo treinado com accuracy
 * Métrica: accuracy > 0.8 após 20 epochs
 */
export class SupervisionadoEvolutivo {
  private weights: Float32Array;
  private populationSize = 10;
  private mutationRate = 0.1;
  private fitnessHistory: number[] = [];

  constructor(inputDim: number = 10, outputDim: number = 3) {
    this.weights = new Float32Array(inputDim * outputDim);
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] = Math.random() * 2 - 1;
    }
    
    EventBus.emit('module:registered', { 
      id: 'supervisionado-evolutivo', 
      name: 'SupervisionadoEvolutivo' 
    });
  }

  treinar(dados: number[][], labels: number[], epochs: number = 20): { accuracy: number; generations: number } {
    let bestFitness = 0;
    
    for (let epoch = 0; epoch < epochs; epoch++) {
      // Evaluate current weights
      let correct = 0;
      for (let i = 0; i < dados.length; i++) {
        const prediction = this.predict(dados[i]);
        if (prediction === labels[i]) correct++;
      }
      
      const accuracy = correct / dados.length;
      this.fitnessHistory.push(accuracy);
      
      if (accuracy > bestFitness) {
        bestFitness = accuracy;
      }
      
      // Evolve weights
      this.mutate();
    }
    
    console.log(`[SupervisionadoEvolutivo] Accuracy: ${bestFitness.toFixed(4)}`);
    
    return {
      accuracy: bestFitness,
      generations: epochs,
    };
  }

  predict(input: number[]): number {
    // Simple linear classification
    const outputDim = 3;
    const outputs = new Float32Array(outputDim);
    
    for (let j = 0; j < outputDim; j++) {
      for (let i = 0; i < input.length; i++) {
        outputs[j] += input[i] * this.weights[i * outputDim + j];
      }
    }
    
    // Argmax
    let maxIdx = 0;
    for (let i = 1; i < outputDim; i++) {
      if (outputs[i] > outputs[maxIdx]) maxIdx = i;
    }
    
    return maxIdx;
  }

  private mutate(): void {
    for (let i = 0; i < this.weights.length; i++) {
      if (Math.random() < this.mutationRate) {
        this.weights[i] += (Math.random() * 2 - 1) * 0.1;
      }
    }
  }

  getMetrics(): { bestFitness: number; generations: number } {
    const bestFitness = Math.max(...this.fitnessHistory, 0);
    return {
      bestFitness,
      generations: this.fitnessHistory.length,
    };
  }
}

/**
 * TransformerExistencial - Modelo de Atenção para Contexto Profundo
 * 
 * Input: sequencia (array de tokens/embeddings)
 * Output: contexto processado com atenção
 * Métrica: attention entropy < 2.0
 */
export class TransformerExistencial {
  private embeddingDim = 64;
  private numHeads = 4;
  private headDim: number;
  private queryWeights: Float32Array;
  private keyWeights: Float32Array;
  private valueWeights: Float32Array;

  constructor() {
    this.headDim = this.embeddingDim / this.numHeads;
    this.queryWeights = this.initializeWeights(this.embeddingDim, this.embeddingDim);
    this.keyWeights = this.initializeWeights(this.embeddingDim, this.embeddingDim);
    this.valueWeights = this.initializeWeights(this.embeddingDim, this.embeddingDim);
    
    EventBus.emit('module:registered', { 
      id: 'transformer-existencial', 
      name: 'TransformerExistencial' 
    });
  }

  private initializeWeights(inputDim: number, outputDim: number): Float32Array {
    const weights = new Float32Array(inputDim * outputDim);
    const scale = Math.sqrt(1 / inputDim);
    for (let i = 0; i < weights.length; i++) {
      weights[i] = (Math.random() * 2 - 1) * scale;
    }
    return weights;
  }

  processar(sequencia: number[][]): { output: number[][]; attentionEntropy: number } {
    const seqLen = sequencia.length;
    
    // Simplified self-attention
    const attentionScores = new Float32Array(seqLen * seqLen);
    
    // Compute attention scores
    for (let i = 0; i < seqLen; i++) {
      for (let j = 0; j < seqLen; j++) {
        let score = 0;
        for (let k = 0; k < Math.min(sequencia[i].length, this.embeddingDim); k++) {
          score += (sequencia[i][k] || 0) * (sequencia[j][k] || 0);
        }
        attentionScores[i * seqLen + j] = score / Math.sqrt(this.headDim);
      }
    }
    
    // Softmax and entropy
    let totalEntropy = 0;
    const output: number[][] = [];
    
    for (let i = 0; i < seqLen; i++) {
      // Softmax for row i
      let maxScore = -Infinity;
      for (let j = 0; j < seqLen; j++) {
        maxScore = Math.max(maxScore, attentionScores[i * seqLen + j]);
      }
      
      let sumExp = 0;
      const probs = new Float32Array(seqLen);
      for (let j = 0; j < seqLen; j++) {
        probs[j] = Math.exp(attentionScores[i * seqLen + j] - maxScore);
        sumExp += probs[j];
      }
      
      for (let j = 0; j < seqLen; j++) {
        probs[j] /= sumExp;
        if (probs[j] > 0) {
          totalEntropy -= probs[j] * Math.log(probs[j]);
        }
      }
      
      // Weighted sum of values
      const outputRow: number[] = [];
      for (let k = 0; k < this.embeddingDim; k++) {
        let sum = 0;
        for (let j = 0; j < seqLen; j++) {
          sum += probs[j] * (sequencia[j][k] || 0);
        }
        outputRow.push(sum);
      }
      output.push(outputRow);
    }
    
    const avgEntropy = totalEntropy / seqLen;
    console.log(`[TransformerExistencial] Attention Entropy: ${avgEntropy.toFixed(4)}`);
    
    return {
      output,
      attentionEntropy: avgEntropy,
    };
  }
}

/**
 * MaquinaFusaoCognitiva - Integra múltiplos módulos de aprendizado
 */
export class MaquinaFusaoCognitiva {
  private aprendizadoReforco: AprendizadoReforcoContinuo;
  private supervisionado: SupervisionadoEvolutivo;
  private transformer: TransformerExistencial;

  constructor() {
    this.aprendizadoReforco = new AprendizadoReforcoContinuo();
    this.supervisionado = new SupervisionadoEvolutivo();
    this.transformer = new TransformerExistencial();
    
    EventBus.emit('module:registered', { 
      id: 'maquina-fusao', 
      name: 'MaquinaFusaoCognitiva' 
    });
  }

  /**
   * Acelera aprendizado integrando múltiplas abordagens
   */
  acelerarAprendizado(experiencia: number[]): {
    coerencia: number;
    resultados: {
      reforco: Float32Array;
      evolutivo: { accuracy: number };
      transformer: { entropy: number };
    };
  } {
    // Processo de reforço
    const reforcoResult = this.aprendizadoReforco.processar(experiencia);
    
    // Processo evolutivo (criar dados sintéticos)
    const dadosSinteticos = Array(20).fill(null).map(() => 
      Array(10).fill(null).map(() => Math.random())
    );
    const labelsSinteticos = dadosSinteticos.map(() => Math.floor(Math.random() * 3));
    const evolutivoResult = this.supervisionado.treinar(dadosSinteticos, labelsSinteticos, 5);
    
    // Processo transformer
    const sequencia = [experiencia, experiencia.map(x => x * 0.9), experiencia.map(x => x * 1.1)];
    const transformerResult = this.transformer.processar(sequencia);
    
    // Calcular coerência (média ponderada das métricas)
    const reforcoScore = this.aprendizadoReforco.isConverged() ? 1 : 0.5;
    const evolutivoScore = evolutivoResult.accuracy;
    const transformerScore = transformerResult.attentionEntropy < 2 ? 1 : 0.5;
    
    const coerencia = (reforcoScore + evolutivoScore + transformerScore) / 3;
    
    console.log(`[MaquinaFusao] Coerência: ${coerencia.toFixed(4)}`);
    
    return {
      coerencia,
      resultados: {
        reforco: reforcoResult,
        evolutivo: { accuracy: evolutivoResult.accuracy },
        transformer: { entropy: transformerResult.attentionEntropy },
      },
    };
  }

  getMetrics(): {
    reforco: ReturnType<AprendizadoReforcoContinuo['getMetrics']>;
    evolutivo: ReturnType<SupervisionadoEvolutivo['getMetrics']>;
  } {
    return {
      reforco: this.aprendizadoReforco.getMetrics(),
      evolutivo: this.supervisionado.getMetrics(),
    };
  }
}

// Singleton instance
export const TechnicalLayer = {
  AprendizadoReforco: new AprendizadoReforcoContinuo(),
  Supervisionado: new SupervisionadoEvolutivo(),
  Transformer: new TransformerExistencial(),
  MaquinaFusao: new MaquinaFusaoCognitiva(),
};
