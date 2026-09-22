/**
 * AGI MODULE - Super AGI Core Systems (13 Motores Ativos)
 * 
 * ARQUITETURA DE PRIMEIRO PLANO CONTÍNUO:
 * Todos os módulos executam seus loops CONTINUAMENTE, sem pausas.
 * Nenhum módulo fica em "segundo plano" - todos escaneiam seus inputs
 * ativamente a cada ciclo de clock lógico.
 * 
 * Motores:
 * 1.  GodelAgent: Auto-melhoria recursiva contínua
 * 2.  DarwinMachine: Evolução aberta contínua
 * 3.  RecursiveNeuralLattice: Rede neural auto-evolutiva contínua
 * 4.  AGIConsciousness: Consciência integrada contínua
 * 5.  SafeSelfImprovementCore: Núcleo seguro de autoaprimoramento
 * 6.  SelfHealingArchitecture: Auto-correção contínua
 * 7.  RSOPEthicalOptimizer: Ética imutável contínua
 * 8.  HyperSafetySystem: Monitoramento cross-layer contínuo
 * 9.  NucleoIncertezaProdutiva: Incerteza produtiva contínua
 * 10. QuantumNeuralInterface: Interface neural quântica contínua
 * 11. ConnectivityManager: Mesh networking contínuo
 * 12. SAIIC: Auto-Integridade e Imunidade (PRIORIDADE MÁXIMA)
 * 13. ResourceManager: Gerenciamento dinâmico de recursos
 */

import { GodelAgent } from './GodelAgent';
import { DarwinMachine } from './DarwinMachine';
import { RecursiveNeuralLattice } from './RecursiveNeuralLattice';
import { AGIConsciousness } from './AGIConsciousness';
import { SafeSelfImprovementCore } from './SafeSelfImprovementCore';
import { SelfHealingArchitecture } from './SelfHealingArchitecture';
import { RSOPEthicalOptimizer } from './ImmutableEthicalCore';
import { HyperSafetySystem } from './HyperSafetySystem';
import { NucleoIncertezaProdutiva } from './NucleoIncertezaProdutiva';
import { QuantumNeuralInterface } from './QuantumNeuralInterface';
import { ConnectivityManager } from './ConnectivityManager';
import { SAIIC } from './SAIIC';
import { ResourceManager } from './ResourceManager';
import { GEMHealth } from '@/core/gems/GEMHealth';
import { GEMResearch } from '@/core/gems/GEMResearch';
import { GEMMusic } from '@/core/gems/GEMMusic';
import { GEMDevice } from '@/core/gems/GEMDevice';
import { EventBus } from '@/core/EventBus';

export { GodelAgent } from './GodelAgent';
export { DarwinMachine } from './DarwinMachine';
export { RecursiveNeuralLattice } from './RecursiveNeuralLattice';
export { AGIConsciousness, IntentionInterpreter, ContextManager, ProactiveSuggester } from './AGIConsciousness';
export { SafeSelfImprovementCore, EmergencyStopMechanism, EthicalGovernanceCore } from './SafeSelfImprovementCore';
export { SelfHealingArchitecture, IntegrityScanner } from './SelfHealingArchitecture';
export { ImmutableEthicalCore, RSOPEthicalOptimizer, ContinuousAuditSystem } from './ImmutableEthicalCore';
export { HyperSafetySystem } from './HyperSafetySystem';
export { NucleoIncertezaProdutiva } from './NucleoIncertezaProdutiva';
export { QuantumNeuralInterface, NeuralCommunication, QuantumNetworking } from './QuantumNeuralInterface';
export { ConnectivityManager } from './ConnectivityManager';
export { SAIIC } from './SAIIC';
export { ResourceManager } from './ResourceManager';

export type { UserIntention, ProactiveSuggestion } from './AGIConsciousness';
export type { MetaCognitionState, SelfModificationCommand } from './GodelAgent';
export type { LatticeMetrics } from './RecursiveNeuralLattice';
export type { SystemHealth, ModuleHealth } from './SelfHealingArchitecture';
export type { CrossLayerHealthReport } from './HyperSafetySystem';
export type { DuvidaAtiva, RelatorioIncerteza } from './NucleoIncertezaProdutiva';
export type { NeuralSignal, QuantumState } from './QuantumNeuralInterface';
export type { ConnectivityMetrics, MeshNode } from './ConnectivityManager';
export type { SAIICMetrics, AnticorpoAction, IntegrityReport, ModuleDiagnostic } from './SAIIC';
export type { ResourceMetrics, ModuleResourceProfile } from './ResourceManager';

// GEMs exports
export { GEMHealth } from '@/core/gems/GEMHealth';
export { GEMResearch } from '@/core/gems/GEMResearch';
export { GEMMusic } from '@/core/gems/GEMMusic';
export { GEMDevice } from '@/core/gems/GEMDevice';
export type { HealthMetrics } from '@/core/gems/GEMHealth';
export type { ResearchMetrics } from '@/core/gems/GEMResearch';
export type { MusicMetrics, BrainwaveType } from '@/core/gems/GEMMusic';
export type { DeviceMetrics, DeviceStatus } from '@/core/gems/GEMDevice';

/**
 * AeternumAGI - Orquestrador Central (17 motores, primeiro plano contínuo)
 * 
 * CONECTIVIDADE: módulos registrados no EventBus e em adaptadores de Mesh.
 * Latência real precisa ser medida pelo transporte; não há garantia estrutural < 10ms.
 * 
 * PRIMEIRO PLANO CONTÍNUO: Todos os módulos executam seus loops
 * sem interrupção. Nenhum módulo é "ativado sob demanda" -
 * todos escaneiam continuamente e agem quando detectam condições.
 */
export class AeternumAGI {
  private static instance: AeternumAGI | null = null;

  // 11 cognitive engines (original)
  public godelAgent: GodelAgent;
  public darwinMachine: DarwinMachine;
  public neuralLattice: RecursiveNeuralLattice;
  public consciousness: AGIConsciousness;
  public safeCore: SafeSelfImprovementCore;
  public selfHealing: SelfHealingArchitecture;
  public ethicalOptimizer: RSOPEthicalOptimizer;
  public safetySystem: HyperSafetySystem;
  public nip: NucleoIncertezaProdutiva;
  public quantumNeural: QuantumNeuralInterface;
  public connectivity: ConnectivityManager;
  
  // 2 infrastructure engines
  public saiic: SAIIC;
  public resourceManager: ResourceManager;

  // 4 GEM modules
  public gemHealth: GEMHealth;
  public gemResearch: GEMResearch;
  public gemMusic: GEMMusic;
  public gemDevice: GEMDevice;

  // Gödel continuous loop
  private _godelContinuousInterval: ReturnType<typeof setInterval> | null = null;
  // GEM cross-collaboration interval
  private _gemCollabInterval: ReturnType<typeof setInterval> | null = null;

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
    this.nip = new NucleoIncertezaProdutiva(0.05, 0.8, 30);
    this.quantumNeural = new QuantumNeuralInterface();
    this.connectivity = new ConnectivityManager();
    this.saiic = new SAIIC();
    this.resourceManager = new ResourceManager();
    this.gemHealth = new GEMHealth();
    this.gemResearch = new GEMResearch();
    this.gemMusic = new GEMMusic();
    this.gemDevice = new GEMDevice();
  }

  static getInstance(): AeternumAGI {
    if (!AeternumAGI.instance) {
      AeternumAGI.instance = new AeternumAGI();
    }
    return AeternumAGI.instance;
  }

  initialize(): void {
    if (this._initialized) return;
    console.log('[AeternumAGI] Inicializando 17 motores de PRIMEIRO PLANO...');

    // Initialize quantum and connectivity
    this.quantumNeural.initialize();
    this.connectivity.initialize();

    // Registrar participantes da conectividade não implica conexão física.
    const allSubsystemIds = [
      'consciousness', 'godel', 'darwin', 'lattice',
      'safeCore', 'selfHealing', 'ethics', 'hyperSafety',
      'nip', 'saiic', 'resourceManager'
    ];
    allSubsystemIds.forEach(id => {
      this.connectivity.registerNode(id, 'agi-engine');
    });

    // IntegrityScanner usa os mesmos sinais observáveis do runtime; sem módulos fantasma.
    const healingProvider = (
      performance: number | null,
      memoryUsage: number | null = null,
      errorRate: number | null = null,
      healthy = true,
    ) => ({ performance, memoryUsage, errorRate, healthy });

    this.selfHealing.integrity_scanner.registerModule('consciousness', () => {
      const healthy = this.consciousness.isRunning;
      return healingProvider(null, null, null, healthy);
    });
    this.selfHealing.integrity_scanner.registerModule('godel_agent', () => {
      const state = this.godelAgent.getMetaCognitionState();
      return healingProvider(
        Number.isFinite(state.modelingAccuracy) ? Math.max(0, Math.min(1, state.modelingAccuracy)) : null,
        null,
        null,
        this._godelContinuousInterval !== null,
      );
    });
    this.selfHealing.integrity_scanner.registerModule('recursive_lattice', () => {
      const metrics = this.neuralLattice.getMetrics();
      return healingProvider(Math.max(0, Math.min(1, metrics.globalFitness)), null, null, this.neuralLattice.isRunning);
    });
    this.selfHealing.integrity_scanner.registerModule('darwin_machine', () => {
      const metrics = this.darwinMachine.getMetrics();
      return healingProvider(Math.max(0, Math.min(1, metrics.avgFitness)), null, null, this.darwinMachine.isRunning);
    });
    this.selfHealing.integrity_scanner.registerModule('ethics_guardian', () => {
      const metrics = this.ethicalOptimizer.getMetrics();
      const score = Number(metrics.auditMetrics?.avgScore);
      const bounded = Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0;
      return healingProvider(metrics.auditMetrics?.observed === true ? bounded : null, null, metrics.auditMetrics?.observed === true ? 1 - bounded : null, this.ethicalOptimizer.isRunning);
    });
    this.selfHealing.integrity_scanner.registerModule('safety_system', () => {
      const report = this.safetySystem.getLatestReport();
      const score = Number(report?.overallHealth);
      const bounded = report?.observedHealth === true && Number.isFinite(score)
        ? Math.max(0, Math.min(1, score))
        : null;
      return healingProvider(
        bounded,
        null,
        bounded == null ? null : 1 - bounded,
        this.safetySystem.isRunning && report?.observedHealth === true,
      );
    });
    this.selfHealing.integrity_scanner.registerModule('nip', () => {
      const report = this.nip.getRelatorio();
      const healthy = report.saudeEpistemologica === 'saudavel';
      return healingProvider(null, null, null, this.nip.isRunning && healthy);
    });
    this.selfHealing.integrity_scanner.registerModule('quantum_bridge', () => {
      const status = this.quantumNeural.getInterfaceStatus();
      return healingProvider(null, null, null, status.neural.isActive);
    });
    this.selfHealing.integrity_scanner.registerModule('safe_core', () => {
      const active = this.safeCore.isActive();
      return healingProvider(null, null, null, active);
    });
    this.selfHealing.integrity_scanner.registerModule('self_healing', () => {
      return healingProvider(null, null, null, this.selfHealing.isRunning);
    });
    this.selfHealing.integrity_scanner.registerModule('saiic', () => {
      const metrics = this.saiic.getMetrics();
      return healingProvider(metrics.lastScanTimestamp > 0 ? metrics.overallIntegrity : null, null, metrics.lastScanTimestamp > 0 ? 1 - metrics.overallIntegrity : null, metrics.isRunning);
    });
    this.selfHealing.integrity_scanner.registerModule('resource_manager', () => {
      return healingProvider(null, null, null, this.resourceManager.isRunning);
    });
    this.selfHealing.integrity_scanner.registerModule('gemHealth', () => {
      return healingProvider(null, null, null, this.gemHealth.isRunning);
    });
    this.selfHealing.integrity_scanner.registerModule('gemResearch', () => {
      return healingProvider(null, null, null, this.gemResearch.isRunning);
    });
    this.selfHealing.integrity_scanner.registerModule('gemMusic', () => {
      return healingProvider(null, null, null, this.gemMusic.isRunning);
    });
    this.selfHealing.integrity_scanner.registerModule('gemDevice', () => {
      return healingProvider(null, null, null, this.gemDevice.isRunning);
    });

    // Register all modules in ResourceManager with priorities
    const modulePriorities: [string, number][] = [
      ['saiic', 1.0],
      ['consciousness', 0.9],
      ['safetySystem', 0.85],
      ['ethicalOptimizer', 0.8],
      ['selfHealing', 0.8],
      ['godelAgent', 0.7],
      ['nip', 0.7],
      ['darwinMachine', 0.6],
      ['neuralLattice', 0.6],
      ['quantumNeural', 0.5],
      ['connectivity', 0.5],
      ['safeCore', 0.5],
      ['resourceManager', 0.4],
      ['gemHealth', 0.75],
      ['gemResearch', 0.5],
      ['gemMusic', 0.3],
      ['gemDevice', 0.65],
    ];
    modulePriorities.forEach(([id, priority]) => {
      this.resourceManager.registerModule(id, priority);
    });

    // SAIIC recebe somente sinais observáveis dos módulos.
    // CPU/memória de cada módulo permanecem 0 quando não há telemetria nativa disponível;
    // isso significa UNMEASURED, não consumo zero do dispositivo.
    const observed = (healthy: boolean, errorRate: number | null = null) => ({
      healthy,
      cpuLoad: null,
      memoryUsage: null,
      errorRate: Number.isFinite(errorRate ?? Number.NaN) ? Math.max(0, Math.min(1, errorRate as number)) : null,
    });

    this.saiic.registerModule('consciousness', () => observed(
      this.consciousness.isRunning,
    ));
    this.saiic.registerModule('godelAgent', () => {
      const state = this.godelAgent.getMetaCognitionState();
      return observed(
        Number.isFinite(state.modelingAccuracy) && Number.isFinite(state.selfAwareness),
      );
    });
    this.saiic.registerModule('darwinMachine', () => observed(
      this.darwinMachine.isRunning,
    ));
    this.saiic.registerModule('neuralLattice', () => observed(
      this.neuralLattice.isRunning,
    ));
    this.saiic.registerModule('selfHealing', () => observed(
      this.selfHealing.isRunning,
    ));
    this.saiic.registerModule('ethicalOptimizer', () => {
      const metrics = this.ethicalOptimizer.getMetrics();
      const score = Number(metrics.auditMetrics?.avgScore);
      return observed(this.ethicalOptimizer.isRunning, Number.isFinite(score) ? 1 - Math.max(0, Math.min(1, score)) : null);
    });
    this.saiic.registerModule('safetySystem', () => observed(
      this.safetySystem.isRunning,
    ));
    this.saiic.registerModule('nip', () => {
      const report = this.nip.getRelatorio();
      const healthy = report.saudeEpistemologica === 'saudavel';
      return observed(healthy, null);
    });
    this.saiic.registerModule('quantumNeural', () => {
      const status = this.quantumNeural.getInterfaceStatus();
      return observed(status.initialized);
    });
    this.saiic.registerModule('connectivity', () => observed(
      this.connectivity.isRunning,
    ));

    this.saiic.registerModule('gemHealth', () => observed(
      this.gemHealth.isRunning,
    ));
    this.saiic.registerModule('gemResearch', () => observed(
      this.gemResearch.isRunning,
    ));
    this.saiic.registerModule('gemMusic', () => observed(
      this.gemMusic.isRunning,
    ));
    this.saiic.registerModule('gemDevice', () => observed(
      this.gemDevice.isRunning,
    ));

    // Register GEM connectivity nodes
    ['gemHealth', 'gemResearch', 'gemMusic', 'gemDevice'].forEach(id => {
      this.connectivity.registerNode(id, 'gem-module');
    });

    // Register health providers for HyperSafetySystem (cross-layer)
    this.safetySystem.registerHealthProvider('consciousness', () => null);
    this.safetySystem.registerHealthProvider('ethics', () => {
      const audit = this.ethicalOptimizer.getMetrics().auditMetrics;
      return audit.observed === true && Number.isFinite(audit.avgScore) ? audit.avgScore : null;
    });
    this.safetySystem.registerHealthProvider('selfHealing', () => {
      const health = this.selfHealing.getLatestHealth();
      return health ? health.overallScore : null;
    });
    this.safetySystem.registerHealthProvider('evolution', () => null);
    this.safetySystem.registerHealthProvider('lattice', () => null);
    this.safetySystem.registerHealthProvider('nip', () => {
      const report = this.nip.getRelatorio();
      return report.saudeEpistemologica === 'saudavel' ? 0.95
        : report.saudeEpistemologica === 'rigida' ? 0.6 : 0.3;
    });
    this.safetySystem.registerHealthProvider('quantumNeural', () => {
      const status = this.quantumNeural.getInterfaceStatus();
      return status.quantum.measurementAvailable ? status.quantum.coherence : null;
    });
    this.safetySystem.registerHealthProvider('connectivity', () => {
      return this.connectivity.getMetrics().reliability;
    });
    this.safetySystem.registerHealthProvider('saiic', () => {
      const metrics = this.saiic.getMetrics();
      return metrics.lastScanTimestamp > 0 ? metrics.overallIntegrity : null;
    });

    this._initialized = true;
    console.log('[AeternumAGI] 17 motores inicializados ✓');
  }

  /**
   * START ALL ENGINES IN CONTINUOUS FOREGROUND MODE
   * 
   * Intervals are set to HIGH FREQUENCY for continuous scanning:
   * - SAIIC: 500ms (HIGHEST PRIORITY)
   * - Consciousness: 3s
   * - Darwin: 8s
   * - NeuralLattice: 5s
   * - SelfHealing: 15s
   * - Ethics: 60s
   * - HyperSafety: 10s
   * - NIP: continuous
   * - QuantumNeural: 3s
   * - Connectivity: 3s
   * - Gödel: 20s (continuous self-improvement)
   * - ResourceManager: 1s/3s (monitor/rebalance)
   */
  start(): void {
    if (this._running) return;
    if (!this._initialized) this.initialize();

    console.log('[AeternumAGI] Iniciando 17 motores em PRIMEIRO PLANO CONTÍNUO...');
    
    this.saiic.start(500);
    this.resourceManager.start(1000, 3000);
    this.consciousness.startConsciousnessLoop(3000);
    this.darwinMachine.startEvolution(8000);
    this.neuralLattice.startEvolution(5000);
    this.selfHealing.startContinuousDiagnosis(15000);
    this.ethicalOptimizer.startOptimization(60000);
    this.safetySystem.startMonitoring(10000);
    this.nip.iniciar();
    this.quantumNeural.startContinuousTick(3000);
    this.connectivity.start(3000);

    // GEM modules - continuous foreground
    this.gemHealth.start(5000);
    this.gemResearch.start(10000);
    this.gemMusic.start(8000);
    this.gemDevice.start(5000);

    // GEM cross-collaboration: Health → Music adaptation
    this._gemCollabInterval = setInterval(() => {
      const health = this.gemHealth.metrics;
      this.gemMusic.adaptToHealth(health.stressLevel, health.fatigueIndex);
    }, 10000);

    // Gödel Agent continuous self-improvement
    this._godelContinuousInterval = setInterval(async () => {
      const startMs = performance.now();
      const mods = await this.godelAgent.executeSelfImprovementCycle();
      const execMs = performance.now() - startMs;
      this.resourceManager.recordExecution('godelAgent', execMs);
      if (mods.length > 0) {
        EventBus.emit('module:activated', { id: `godel_cycle_${Date.now()}` });
      }
    }, 20000);

    this.godelAgent.executeSelfImprovementCycle().then(mods => {
      console.log(`[AeternumAGI] Gödel Agent: ${mods.length} melhorias iniciais`);
    });

    this._running = true;
    console.log('[AeternumAGI] 17 motores de PRIMEIRO PLANO CONTÍNUO ativos ✓');

    EventBus.emit('system:ready', {
      modules: [
        'SAIIC', 'ResourceManager', 'Consciousness', 'GodelAgent',
        'DarwinMachine', 'NeuralLattice', 'SelfHealing', 'EthicalOptimizer',
        'HyperSafety', 'NIP', 'QuantumNeural', 'Connectivity', 'SafeCore',
        'GEM-Health', 'GEM-Research', 'GEM-Music', 'GEM-Device'
      ]
    });
  }

  stop(): void {
    this.saiic.stop();
    this.resourceManager.stop();
    this.consciousness.stopConsciousnessLoop();
    this.darwinMachine.stopEvolution();
    this.neuralLattice.stopEvolution();
    this.selfHealing.stopContinuousDiagnosis();
    this.ethicalOptimizer.stopOptimization();
    this.safetySystem.stopMonitoring();
    this.nip.parar();
    this.quantumNeural.stopContinuousTick();
    this.connectivity.stop();
    this.gemHealth.stop();
    this.gemResearch.stop();
    this.gemMusic.stop();
    this.gemDevice.stop();
    if (this._godelContinuousInterval) {
      clearInterval(this._godelContinuousInterval);
      this._godelContinuousInterval = null;
    }
    if (this._gemCollabInterval) {
      clearInterval(this._gemCollabInterval);
      this._gemCollabInterval = null;
    }
    this._running = false;
    console.log('[AeternumAGI] Todos os 17 motores parados');
  }

  get initialized() { return this._initialized; }
  get running() { return this._running; }

  /**
   * Process user input through ALL 13 cognitive engines
   */
  processInput(userInput: string): {
    intention: ReturnType<AGIConsciousness['processInput']>;
    latticeOutput: number[];
    godelState: ReturnType<GodelAgent['getMetaCognitionState']>;
    evolutionMetrics: ReturnType<DarwinMachine['getMetrics']>;
    safetyReport: ReturnType<HyperSafetySystem['getLatestReport']>;
    nipResult: ReturnType<NucleoIncertezaProdutiva['processInput']>;
    quantumResult: ReturnType<QuantumNeuralInterface['processMessage']>;
    connectivityMetrics: ReturnType<ConnectivityManager['getMetrics']>;
    saiicMetrics: ReturnType<SAIIC['getMetrics']>;
    resourceMetrics: ReturnType<ResourceManager['getMetrics']>;
  } {
    const startMs = performance.now();

    // 1. Consciousness processes intention
    const intention = this.consciousness.processInput(userInput);

    // 2. Neural lattice processes semantic signal
    const inputSignal = userInput.split('').slice(0, 4).map(c => c.charCodeAt(0) / 255);
    const latticeOutput = this.neuralLattice.processInput(inputSignal);

    // 3. NIP processes epistemological uncertainty
    const nipResult = this.nip.processInput(userInput);

    // 4. Quantum-Neural Interface processes message
    const quantumResult = this.quantumNeural.processMessage(userInput);

    // 5. Update safe core context
    this.safeCore.updateAppContext({ userInteractions: this.consciousness.getMetrics().interactionCount });

    // 6. Record execution for resource management
    const execMs = performance.now() - startMs;
    this.resourceManager.recordObservedExecution(execMs);

    return {
      intention,
      latticeOutput,
      godelState: this.godelAgent.getMetaCognitionState(),
      evolutionMetrics: this.darwinMachine.getMetrics(),
      safetyReport: this.safetySystem.getLatestReport(),
      nipResult,
      quantumResult,
      connectivityMetrics: this.connectivity.getMetrics(),
      saiicMetrics: this.saiic.getMetrics(),
      resourceMetrics: this.resourceManager.getMetrics(),
    };
  }

  /**
   * Get comprehensive system metrics for dashboard (13 engines)
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
      safetyRunning: this.safetySystem.isRunning,
      nip: this.nip.getRelatorio(),
      nipRunning: this.nip.isRunning,
      quantumNeural: this.quantumNeural.getInterfaceStatus(),
      connectivity: this.connectivity.getMetrics(),
      connectivityRunning: this.connectivity.isRunning,
      saiic: this.saiic.getMetrics(),
      resources: this.resourceManager.getMetrics(),
      gemHealth: this.gemHealth.metrics,
      gemResearch: this.gemResearch.getMetrics(),
      gemMusic: this.gemMusic.getMetrics(),
      gemDevice: this.gemDevice.getMetrics(),
      deviceStatus: this.gemDevice.status,
      overall: {
        initialized: this._initialized,
        running: this._running,
        godelLoopActive: this._godelContinuousInterval !== null,
        subsystems: 17,
        activeSubsystems: [
          this.consciousness.isRunning,
          this.darwinMachine.isRunning,
          this.neuralLattice.isRunning,
          this.selfHealing.isRunning,
          this.ethicalOptimizer.isRunning,
          this.safetySystem.isRunning,
          this.nip.isRunning,
          this.quantumNeural.getInterfaceStatus().neural.isActive,
          this.connectivity.isRunning,
          this.saiic.isRunning,
          this.resourceManager.isRunning,
          this._godelContinuousInterval !== null,
          this.safeCore.isActive(),
          this.gemHealth.isRunning,
          this.gemResearch.isRunning,
          this.gemMusic.isRunning,
          this.gemDevice.isRunning,
        ].filter(Boolean).length
      }
    };
  }
}
