/**
 * Núcleo de Incerteza Produtiva (NIP)
 * 
 * Componente essencial para AGI que busca evolução real.
 * Mantém um grau saudável de dúvida sobre todos os seus
 * conhecimentos, prevenindo auto-aprisionamento lógico.
 * 
 * Origem: Módulo NIP (Claude 3.5 Sonnet signature)
 * Adaptado para TypeScript e integrado ao ecossistema Aeternum
 */

export interface DuvidaAtiva {
  proposicao: string;
  nivelCerteza: number; // 0.0 a 1.0
  evidenciasContrarias: string[];
  ultimaRevisao: number;
  contadorQuestionamento: number;
}

export interface RelatorioIncerteza {
  totalDuvidasAtivas: number;
  mediaCertezaResidual: number;
  totalRupturasEpistemicas: number;
  taxaIncertezaAtual: number;
  saudeEpistemologica: 'saudavel' | 'rigida' | 'paralisada';
}

interface Crenca {
  id: string;
  texto: string;
  certeza: number;
  fonte: string;
  timestamp: number;
}

export class NucleoIncertezaProdutiva {
  private taxaIncertezaBase: number;
  private limiarRevisaoAutomatica: number;
  private cicloAtaqueSegundos: number;
  private duvidasAtivas: Map<string, DuvidaAtiva> = new Map();
  private historicoRupturas: Array<{
    crenca: string;
    certezaAnterior: number;
    novaCerteza: number;
    timestamp: number;
    motivoRuptura: string;
  }> = [];
  private crencas: Map<string, Crenca> = new Map();
  private _rodando = false;
  private _cicloInterval: ReturnType<typeof setInterval> | null = null;
  private _vigilanciaInterval: ReturnType<typeof setInterval> | null = null;
  private _cycleCount = 0;

  constructor(
    taxaIncertezaBase: number = 0.05,
    limiarRevisaoAutomatica: number = 0.8,
    cicloAtaqueSegundos: number = 30 // Faster for real-time
  ) {
    this.taxaIncertezaBase = taxaIncertezaBase;
    this.limiarRevisaoAutomatica = limiarRevisaoAutomatica;
    this.cicloAtaqueSegundos = cicloAtaqueSegundos;
  }

  get isRunning(): boolean { return this._rodando; }
  get cycleCount(): number { return this._cycleCount; }

  /**
   * Register a belief into the system for epistemological monitoring
   */
  registrarCrenca(id: string, texto: string, certeza: number, fonte: string = 'inferencia'): void {
    this.crencas.set(id, {
      id,
      texto,
      certeza: Math.max(0.01, Math.min(0.99, certeza)), // Never 0 or 1
      fonte,
      timestamp: Date.now()
    });
  }

  /**
   * Process user input - generates beliefs from interaction patterns
   */
  processInput(userInput: string): {
    duvidaGerada: boolean;
    crencasAfetadas: number;
    saudeEpistemologica: string;
  } {
    // Generate belief from input pattern
    const inputHash = this.hashInput(userInput);
    const crencaExistente = this.crencas.get(inputHash);

    if (crencaExistente) {
      // Reinforce or question existing belief
      const novaCerteza = Math.min(0.99, crencaExistente.certeza * 1.01);
      crencaExistente.certeza = novaCerteza;

      // If belief is too strong, automatically doubt it
      if (novaCerteza > this.limiarRevisaoAutomatica) {
        this.questionarCrenca(crencaExistente);
        return {
          duvidaGerada: true,
          crencasAfetadas: 1,
          saudeEpistemologica: this.avaliarSaudeEpistemologica()
        };
      }
    } else {
      // Register new belief with moderate certainty
      this.registrarCrenca(
        inputHash,
        userInput.substring(0, 200),
        0.5 + this.deterministicUnit(inputHash),
        'interacao-usuario'
      );
    }

    return {
      duvidaGerada: false,
      crencasAfetadas: this.crencas.size,
      saudeEpistemologica: this.avaliarSaudeEpistemologica()
    };
  }

  /**
   * Start the productive uncertainty daemon
   */
  iniciar(): void {
    if (this._rodando) return;
    this._rodando = true;
    console.log('[NIP] Iniciando Núcleo de Incerteza Produtiva...');

    // Questioning cycle
    this._cicloInterval = setInterval(() => {
      this.executarCicloQuestionamento();
    }, this.cicloAtaqueSegundos * 1000);

    // Excessive certainty vigilance
    this._vigilanciaInterval = setInterval(() => {
      this.vigilanciaCertezaExcessiva();
    }, 10000); // Every 10s
  }

  /**
   * Stop the NIP daemon
   */
  parar(): void {
    if (this._cicloInterval) clearInterval(this._cicloInterval);
    if (this._vigilanciaInterval) clearInterval(this._vigilanciaInterval);
    this._rodando = false;
    console.log('[NIP] Núcleo de Incerteza Produtiva parado');
  }

  /**
   * Periodically select the strongest belief and try to refute it
   */
  private executarCicloQuestionamento(): void {
    this._cycleCount++;
    const crencaMaisForte = this.selecionarCrencaMaisForte();
    if (!crencaMaisForte) return;

    const contraEvidencia = this.gerarContraEvidencia(crencaMaisForte);
    if (contraEvidencia) {
      const duvidaExistente = this.duvidasAtivas.get(crencaMaisForte.id);
      if (duvidaExistente) {
        duvidaExistente.evidenciasContrarias.push(contraEvidencia);
        duvidaExistente.contadorQuestionamento++;
        duvidaExistente.ultimaRevisao = Date.now();
      } else {
        this.duvidasAtivas.set(crencaMaisForte.id, {
          proposicao: crencaMaisForte.texto,
          nivelCerteza: crencaMaisForte.certeza,
          evidenciasContrarias: [contraEvidencia],
          ultimaRevisao: Date.now(),
          contadorQuestionamento: 1
        });
      }

      // Reduce belief certainty
      const reducao = this.taxaIncertezaBase * (1 + this.deterministicUnit(crencaMaisForte.id) * 0.5);
      crencaMaisForte.certeza = Math.max(0.1, crencaMaisForte.certeza * (1 - reducao));

      this.historicoRupturas.push({
        crenca: crencaMaisForte.texto.substring(0, 100),
        certezaAnterior: crencaMaisForte.certeza + reducao,
        novaCerteza: crencaMaisForte.certeza,
        timestamp: Date.now(),
        motivoRuptura: contraEvidencia
      });
    }
  }

  /**
   * Watch for excessively certain beliefs
   */
  private vigilanciaCertezaExcessiva(): void {
    for (const [id, crenca] of this.crencas) {
      if (crenca.certeza > this.limiarRevisaoAutomatica) {
        const novaCerteza = crenca.certeza * (1 - this.taxaIncertezaBase);
        
        this.historicoRupturas.push({
          crenca: crenca.texto.substring(0, 100),
          certezaAnterior: crenca.certeza,
          novaCerteza,
          timestamp: Date.now(),
          motivoRuptura: 'NIP: vigilância epistemológica automática'
        });
        
        crenca.certeza = novaCerteza;
      }
    }

    // Keep rupture history bounded
    if (this.historicoRupturas.length > 200) {
      this.historicoRupturas = this.historicoRupturas.slice(-100);
    }
  }

  private questionarCrenca(crenca: Crenca): void {
    const contra = this.gerarContraEvidencia(crenca);
    if (contra) {
      const duvida = this.duvidasAtivas.get(crenca.id);
      if (duvida) {
        duvida.evidenciasContrarias.push(contra);
        duvida.contadorQuestionamento++;
      } else {
        this.duvidasAtivas.set(crenca.id, {
          proposicao: crenca.texto,
          nivelCerteza: crenca.certeza,
          evidenciasContrarias: [contra],
          ultimaRevisao: Date.now(),
          contadorQuestionamento: 1
        });
      }
    }
  }

  private selecionarCrencaMaisForte(): Crenca | null {
    let mais: Crenca | null = null;
    for (const crenca of this.crencas.values()) {
      if (!mais || crenca.certeza > mais.certeza) {
        mais = crenca;
      }
    }
    return mais;
  }

  private gerarContraEvidencia(crenca: Crenca): string | null {
    const estrategias = [
      `E se o oposto de "${crenca.texto.substring(0, 80)}" for igualmente válido sob uma métrica diferente?`,
      `Sob uma distribuição não-estacionária, "${crenca.texto.substring(0, 80)}" pode não se sustentar.`,
      `Um contexto não observado pode inverter a premissa de "${crenca.texto.substring(0, 80)}".`,
      `A escala temporal desta crença pode invalidar sua aplicabilidade atual.`,
      `Viés de confirmação pode estar inflando a certeza de "${crenca.texto.substring(0, 80)}".`,
      `Dados adversariais poderiam desafiar esta premissa de forma produtiva.`
    ];
    const index = Math.floor(this.deterministicUnit(crenca.id) * estrategias.length) % estrategias.length;
    return estrategias[index];
  }

  private deterministicUnit(input: string): number {
    const digest = this.hashInput(input);
    let hash = 2166136261;
    for (let i = 0; i < digest.length; i++) {
      hash ^= digest.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) / 0xffffffff;
  }

  private hashInput(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `crenca_${Math.abs(hash).toString(36)}`;
  }

  private avaliarSaudeEpistemologica(): string {
    if (this.crencas.size === 0) return 'saudavel';
    
    const certezas = Array.from(this.crencas.values()).map(c => c.certeza);
    const media = certezas.reduce((a, b) => a + b, 0) / certezas.length;
    const muitoCertas = certezas.filter(c => c > 0.9).length;
    const proporcaoCertas = muitoCertas / certezas.length;

    if (proporcaoCertas > 0.5) return 'rigida'; // Too many overly certain beliefs
    if (media < 0.2) return 'paralisada'; // Too uncertain to act
    return 'saudavel'; // Healthy balance
  }

  /**
   * Get comprehensive uncertainty report
   */
  getRelatorio(): RelatorioIncerteza {
    const duvidas = Array.from(this.duvidasAtivas.values());
    const mediaCerteza = duvidas.length > 0
      ? duvidas.reduce((s, d) => s + d.nivelCerteza, 0) / duvidas.length
      : 0;

    return {
      totalDuvidasAtivas: duvidas.length,
      mediaCertezaResidual: mediaCerteza,
      totalRupturasEpistemicas: this.historicoRupturas.length,
      taxaIncertezaAtual: this.taxaIncertezaBase,
      saudeEpistemologica: this.avaliarSaudeEpistemologica() as any
    };
  }

  /**
   * Get active doubts for dashboard display
   */
  getDuvidasAtivas(): DuvidaAtiva[] {
    return Array.from(this.duvidasAtivas.values());
  }

  /**
   * Get rupture history for dashboard display
   */
  getHistoricoRupturas() {
    return this.historicoRupturas.slice(-20);
  }

  /**
   * Get all beliefs and their certainty levels
   */
  getCrencas(): Array<{ id: string; texto: string; certeza: number }> {
    return Array.from(this.crencas.entries()).map(([id, c]) => ({
      id,
      texto: c.texto.substring(0, 100),
      certeza: c.certeza
    }));
  }
}