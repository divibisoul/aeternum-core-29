/**
 * AGI MODULE - Super AGI Core Systems
 * 
 * Integra todos os motores AGI:
 * - GodelAgent: Auto-melhoria recursiva
 * - DarwinMachine: Evolução aberta de agentes
 * - RecursiveNeuralLattice: Rede neural auto-evolutiva
 * - AGIConsciousness: Sistema de consciência integrada
 * - SafeSelfImprovementCore: Núcleo seguro de autoaprimoramento
 * - SelfHealingArchitecture: Auto-correção e reconstrução
 * - ImmutableEthicalCore + RSOPEthicalOptimizer: Ética imutável
 * - HyperSafetySystem: Monitoramento cross-layer
 */

import { GodelAgent } from './GodelAgent';
import { DarwinMachine } from './DarwinMachine';
import { RecursiveNeuralLattice } from './RecursiveNeuralLattice';
import { AGIConsciousness } from './AGIConsciousness';
import { SafeSelfImprovementCore } from './SafeSelfImprovementCore';
import { SelfHealingArchitecture } from './SelfHealingArchitecture';
import { RSOPEthicalOptimizer } from './ImmutableEthicalCore';
import { HyperSafetySystem } from './HyperSafetySystem';

export { GodelAgent } from './GodelAgent';
export { DarwinMachine } from './DarwinMachine';
export { RecursiveNeuralLattice } from './RecursiveNeuralLattice';
export { AGIConsciousness, IntentionInterpreter, ContextManager, ProactiveSuggester } from './AGIConsciousness';
export { SafeSelfImprovementCore, EmergencyStopMechanism, EthicalGovernanceCore } from './SafeSelfImprovementCore';
export { SelfHealingArchitecture, IntegrityScanner } from './SelfHealingArchitecture';
export { ImmutableEthicalCore, RSOPEthicalOptimizer, ContinuousAuditSystem } from './ImmutableEthicalCore';
export { HyperSafetySystem } from './HyperSafetySystem';

export type { UserIntention, ProactiveSuggestion } from './AGIConsciousness';
export type { MetaCognitionState, SelfModificationCommand } from './GodelAgent';
export type { LatticeMetrics } from './RecursiveNeuralLattice';
export type { SystemHealth, ModuleHealth } from './SelfHealingArchitecture';
export type { CrossLayerHealthReport } from './HyperSafetySystem';

/**
 * AeternumAGI - Orquestrador Central de todos os sistemas AGI
 * Singleton que gerencia ciclo de vida de todos os subsistemas
 */
export class AeternumAGI {
  private static instance: AeternumAGI | null = null;

  public godelAgent: GodelAgent;
  public darwinMachine: DarwinMachine;
  public neuralLattice: RecursiveNeuralLattice;
  public consciousness: AGIConsciousness;
  public safeCore: SafeSelfImprovementCore;
  public selfHealing: SelfHealingArchitecture;
  public ethicalOptimizer: RSOPEthicalOptimizer;
  public safetySystem: HyperSafetySystem;

  private _initialized = false;
  private _running = false;

  private constructor() {
    this.godelAgent = new GodelAgent();
    this.darwinMachine = new DarwinMachine();
    this.neuralLattice = new RecursiveNeuralLattice();
    this.consciousness = new AGIConsciousness();
    this.safeCore = new SafeSelfImprovementCore({
      currentRoute: '/', userInteractions: 0,
      systemState: 'idle', moduleStates: {}
    });
    this.selfHealing = new SelfHealingArchitecture(this.safeCore);
    this.ethicalOptimizer = new RSOPEthicalOptimizer();
    this.safetySystem = new HyperSafetySystem();
  }

  static getInstance(): AeternumAGI {
    if (!AeternumAGI.instance) {
      AeternumAGI.instance = new AeternumAGI();
    }
    return AeternumAGI.instance;
  }

  initialize(): void {
    if (this._initialized) return;
    console.log('[AeternumAGI] Inicializando todos os subsistemas...');

    // Register health providers for cross-layer monitoring
    this.safetySystem.registerHealthProvider('consciousness', () => {
      const metrics = this.consciousness.getMetrics();
      return metrics.isRunning ? 0.9 : 0.5;
    });
    this.safetySystem.registerHealthProvider('ethics', () => {
      return this.ethicalOptimizer.getMetrics().auditMetrics.avgScore;
    });
    this.safetySystem.registerHealthProvider('selfHealing', () => {
      const health = this.selfHealing.getLatestHealth();
      return health?.overallScore ?? 0.8;
    });
    this.safetySystem.registerHealthProvider('evolution', () => {
      return this.darwinMachine.getMetrics().avgFitness;
    });
    this.safetySystem.registerHealthProvider('lattice', () => {
      return this.neuralLattice.getMetrics().globalFitness;
    });

    this._initialized = true;
    console.log('[AeternumAGI] Todos os subsistemas inicializados');
  }

  start(): void {
    if (this._running) return;
    if (!this._initialized) this.initialize();

    console.log('[AeternumAGI] Iniciando todos os motores...');
    this.consciousness.startConsciousnessLoop(5000);
    this.darwinMachine.startEvolution(15000);
    this.neuralLattice.startEvolution(8000);
    this.selfHealing.startContinuousDiagnosis(60000);
    this.ethicalOptimizer.startOptimization(300000);
    this.safetySystem.startMonitoring(30000);

    // Initial Gödel cycle
    this.godelAgent.executeSelfImprovementCycle().then(mods => {
      console.log(`[AeternumAGI] Gödel Agent: ${mods.length} melhorias iniciais`);
    });

    this._running = true;
    console.log('[AeternumAGI] Todos os motores ativos ✓');
  }

  stop(): void {
    this.consciousness.stopConsciousnessLoop();
    this.darwinMachine.stopEvolution();
    this.neuralLattice.stopEvolution();
    this.selfHealing.stopContinuousDiagnosis();
    this.ethicalOptimizer.stopOptimization();
    this.safetySystem.stopMonitoring();
    this._running = false;
    console.log('[AeternumAGI] Todos os motores parados');
  }

  get initialized() { return this._initialized; }
  get running() { return this._running; }

  /**
   * Process user input through ALL cognitive layers
   */
  processInput(userInput: string): {
    intention: ReturnType<AGIConsciousness['processInput']>;
    latticeOutput: number[];
    godelState: ReturnType<GodelAgent['getMetaCognitionState']>;
    evolutionMetrics: ReturnType<DarwinMachine['getMetrics']>;
    safetyReport: ReturnType<HyperSafetySystem['getLatestReport']>;
  } {
    // 1. Consciousness processes intention
    const intention = this.consciousness.processInput(userInput);

    // 2. Neural lattice processes semantic signal
    const inputSignal = userInput.split('').slice(0, 4).map(c => c.charCodeAt(0) / 255);
    const latticeOutput = this.neuralLattice.processInput(inputSignal);

    // 3. Update safe core context
    this.safeCore.updateAppContext({ userInteractions: this.consciousness.getMetrics().interactionCount });

    return {
      intention,
      latticeOutput,
      godelState: this.godelAgent.getMetaCognitionState(),
      evolutionMetrics: this.darwinMachine.getMetrics(),
      safetyReport: this.safetySystem.getLatestReport()
    };
  }

  /**
   * Get comprehensive system metrics for dashboard
   */
  getFullMetrics() {
    return {
      consciousness: this.consciousness.getMetrics(),
      godel: this.godelAgent.getPerformanceMetrics(),
      godelMeta: this.godelAgent.getMetaCognitionState(),
      darwin: this.darwinMachine.getMetrics(),
      lattice: this.neuralLattice.getMetrics(),
      healing: this.selfHealing.getLatestHealth(),
      ethics: this.ethicalOptimizer.getMetrics(),
      safety: this.safetySystem.getLatestReport(),
      overall: {
        initialized: this._initialized,
        running: this._running,
        subsystems: 8,
        activeSubsystems: [
          this.consciousness.isRunning,
          this.darwinMachine.isRunning,
          this.neuralLattice.isRunning,
          this.selfHealing.isRunning,
          this.ethicalOptimizer.isRunning,
          this.safetySystem.isRunning
        ].filter(Boolean).length
      }
    };
  }
}
