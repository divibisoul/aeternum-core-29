/**
 * CAMADA SIMBÓLICA - Experimental, sem backend quântico físico
 * 
 * Adaptação de camada_simbolica.py para TypeScript
 * Implementa campo morfogenético, barramento quântico e tunelamento cognitivo
 */

import { EventBus } from '../EventBus';

/**
 * CampoMorfogenetico - Campo de influência que molda padrões emergentes
 * 
 * Input: input_data (array numérico)
 * Output: estado atualizado (Float32Array)
 * Métrica: mean shift > 0.05 por update
 */
export class CampoMorfogenetico {
  private estado: Float32Array;
  private dimension = 10;
  private updateHistory: number[] = [];
  private lastMeanShift = 0;

  constructor(dimension: number = 10) {
    this.dimension = dimension;
    this.estado = new Float32Array(dimension);
    
    EventBus.emit('module:registered', { 
      id: 'campo-morfogenetico', 
      name: 'CampoMorfogenetico' 
    });
  }

  /**
   * Atualiza o campo morfogenético com novos dados
   */
  updateMorfo(inputData: number[]): Float32Array {
    const previousMean = this.mean();
    
    for (let i = 0; i < this.dimension; i++) {
      const input = inputData[i] !== undefined ? inputData[i] : 0;
      this.estado[i] += input * 0.05;
    }
    
    const newMean = this.mean();
    this.lastMeanShift = Math.abs(newMean - previousMean);
    this.updateHistory.push(this.lastMeanShift);
    
    console.log(`[CampoMorfogenetico] Update simbólico: mean ${newMean.toFixed(4)}, shift ${this.lastMeanShift.toFixed(4)}`);
    
    EventBus.emit('memory:stored', { 
      id: `morfo-${Date.now()}`, 
      type: 'morphogenetic' 
    });
    
    return this.estado;
  }

  private mean(): number {
    return this.estado.reduce((a, b) => a + b, 0) / this.dimension;
  }

  getEstado(): Float32Array {
    return new Float32Array(this.estado);
  }

  getMetrics(): { mean: number; lastShift: number; totalUpdates: number; avgShift: number } {
    const avgShift = this.updateHistory.length > 0 
      ? this.updateHistory.reduce((a, b) => a + b, 0) / this.updateHistory.length 
      : 0;
    return {
      mean: this.mean(),
      lastShift: this.lastMeanShift,
      totalUpdates: this.updateHistory.length,
      avgShift,
    };
  }
}

/**
 * Subscriber para o barramento quântico
 */
type QuantumSubscriber = (dados: unknown, origem: string) => void;

/**
 * EventoSuperposto - Representa um evento em superposição
 */
interface EventoSuperposto {
  evento: string;
  dados: unknown;
  timestamp: number;
  probabilidade: number;
}

/**
 * BarramentoQuantico - Sistema de eventos com características quânticas
 * 
 * Input: evento, dados, origem
 * Output: emitido (log + superposto)
 * Métrica: subscribers called > 0 sem errors
 */
export class BarramentoQuantico {
  private subscribers: Map<string, QuantumSubscriber[]> = new Map();
  private eventosSupepostos: EventoSuperposto[] = [];
  private maxSuperposicao = 100;
  private emissionCount = 0;
  private errorCount = 0;

  constructor() {
    EventBus.emit('module:registered', { 
      id: 'barramento-quantico', 
      name: 'BarramentoQuantico' 
    });
  }

  /**
   * Subscreve a um evento quântico
   */
  subscribe(evento: string, callback: QuantumSubscriber): () => void {
    if (!this.subscribers.has(evento)) {
      this.subscribers.set(evento, []);
    }
    this.subscribers.get(evento)!.push(callback);
    
    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(evento);
      if (subs) {
        const index = subs.indexOf(callback);
        if (index > -1) subs.splice(index, 1);
      }
    };
  }

  /**
   * Emite evento com fila simbólica; o campo probabilidade é mantido apenas por compatibilidade histórica.
   */
  emitir(evento: string, dados: unknown, origem: string): void {
    this.emissionCount++;
    
    // Notificar subscribers
    const subs = this.subscribers.get(evento);
    if (subs && subs.length > 0) {
      for (const sub of subs) {
        try {
          sub(dados, origem);
        } catch (error) {
          this.errorCount++;
          console.error(`[BarramentoQuantico] Erro ao processar evento ${evento}:`, error);
        }
      }
    }
    
    // Adicionar à superposição
    const eventoSuperposto: EventoSuperposto = {
      evento,
      dados,
      timestamp: Date.now(),
      probabilidade: Math.random(), // Probabilidade quântica simulada
    };
    
    this.eventosSupepostos.push(eventoSuperposto);
    
    // Limitar tamanho da superposição
    if (this.eventosSupepostos.length > this.maxSuperposicao) {
      this.eventosSupepostos.shift();
    }
    
    console.log(`[BarramentoQuantico] Emitido simbólico: ${evento} (deliveryScore: ${eventoSuperposto.probabilidade.toFixed(0)})`);
  }

  /**
   * Colapsa a superposição, selecionando eventos com maior probabilidade
   */
  colapsar(limiar: number = 0.5): EventoSuperposto[] {
    const colapsados = this.eventosSupepostos.filter(e => e.probabilidade >= limiar);
    this.eventosSupepostos = this.eventosSupepostos.filter(e => e.probabilidade < limiar);
    
    console.log(`[BarramentoQuantico] Colapsados ${colapsados.length} eventos`);
    
    return colapsados;
  }

  /**
   * Observa eventos em superposição sem colapsar
   */
  observar(): EventoSuperposto[] {
    return [...this.eventosSupepostos];
  }

  getMetrics(): { 
    emissoes: number; 
    erros: number; 
    superposicao: number;
    subscriberCount: number;
  } {
    let totalSubs = 0;
    this.subscribers.forEach(subs => totalSubs += subs.length);
    
    return {
      emissoes: this.emissionCount,
      erros: this.errorCount,
      superposicao: this.eventosSupepostos.length,
      subscriberCount: totalSubs,
    };
  }
}

/**
 * TunelamentoCognitivo - Permite "saltos" instantâneos entre estados cognitivos
 * 
 * Simula o tunelamento quântico para transições cognitivas não-lineares
 */
export class TunelamentoCognitivo {
  private estados: Map<string, unknown> = new Map();
  private historico: Array<{ de: string; para: string; timestamp: number }> = [];
  private tunelamentosRealizados = 0;

  constructor() {
    EventBus.emit('module:registered', { 
      id: 'tunelamento-cognitivo', 
      name: 'TunelamentoCognitivo' 
    });
  }

  /**
   * Registra um estado cognitivo
   */
  registrarEstado(id: string, estado: unknown): void {
    this.estados.set(id, estado);
  }

  /**
   * Realiza tunelamento entre estados
   * Retorna o estado de destino se a probabilidade permitir
   */
  tunelar(estadoAtual: string, estadoDestino: string): { 
    sucesso: boolean; 
    estado: unknown | null;
    probabilidade: number;
  } {
    const probabilidade = this.calcularProbabilidade(estadoAtual, estadoDestino);
    
    // Tunelamento ocorre se probabilidade > threshold
    const threshold = 0.3;
    const sucesso = probabilidade > threshold;
    
    if (sucesso) {
      this.tunelamentosRealizados++;
      this.historico.push({
        de: estadoAtual,
        para: estadoDestino,
        timestamp: Date.now(),
      });
      
      console.log(`[TunelamentoCognitivo] Túnel ${estadoAtual} → ${estadoDestino} (prob: ${probabilidade.toFixed(3)})`);
    }
    
    return {
      sucesso,
      estado: sucesso ? this.estados.get(estadoDestino) : null,
      probabilidade,
    };
  }

  private calcularProbabilidade(de: string, para: string): number {
    // Simula decaimento exponencial da barreira
    const barreiraCognitiva = Math.abs(de.length - para.length) * 0.1 + 0.5;
    return Math.exp(-barreiraCognitiva);
  }

  getMetrics(): { tunelamentos: number; estadosRegistrados: number } {
    return {
      tunelamentos: this.tunelamentosRealizados,
      estadosRegistrados: this.estados.size,
    };
  }
}

/**
 * EntrelacamentoSistemico - Conecta componentes distantes do sistema
 * 
 * Simula entrelamento quântico para sincronização instantânea
 */
export class EntrelacamentoSistemico {
  private pares: Map<string, { parceiro: string; estado: 'up' | 'down' }> = new Map();
  private sincronizacoes = 0;

  constructor() {
    EventBus.emit('module:registered', { 
      id: 'entrelacamento-sistemico', 
      name: 'EntrelacamentoSistemico' 
    });
  }

  /**
   * Cria correlação simbólica entre dois componentes
   */
  entrelacar(componente1: string, componente2: string): void {
    const seed = Array.from(componente1 + ':' + componente2).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const estadoInicial = seed % 2 === 0 ? 'up' : 'down';
    const estadoOposto = estadoInicial === 'up' ? 'down' : 'up';
    
    this.pares.set(componente1, { parceiro: componente2, estado: estadoInicial });
    this.pares.set(componente2, { parceiro: componente1, estado: estadoOposto });
    
    console.log(`[EntrelacamentoSistemico] Entrelacados: ${componente1} ↔ ${componente2}`);
  }

  /**
   * Mede a correlação simbólica registrada entre dois componentes
   */
  medir(componente: string): { estado: 'up' | 'down'; parceiroColapsado: string } | null {
    const info = this.pares.get(componente);
    if (!info) return null;
    
    this.sincronizacoes++;
    
    // Ao medir, o parceiro colapsa para estado oposto
    const parceiroInfo = this.pares.get(info.parceiro);
    if (parceiroInfo) {
      parceiroInfo.estado = info.estado === 'up' ? 'down' : 'up';
    }
    
    console.log(`[EntrelacamentoSistemico] Medição: ${componente} = ${info.estado}`);
    
    return {
      estado: info.estado,
      parceiroColapsado: info.parceiro,
    };
  }

  getMetrics(): { paresEntrelacados: number; sincronizacoes: number } {
    return {
      paresEntrelacados: this.pares.size / 2,
      sincronizacoes: this.sincronizacoes,
    };
  }
}

// Singleton instance
export const SymbolicLayer = {
  CampoMorfogenetico: new CampoMorfogenetico(),
  BarramentoQuantico: new BarramentoQuantico(),
  TunelamentoCognitivo: new TunelamentoCognitivo(),
  EntrelacamentoSistemico: new EntrelacamentoSistemico(),
};
