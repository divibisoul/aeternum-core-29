/**
 * PROJETO CLAREIRA - Sistema Neural Bio-Inspirado Integrado
 * 
 * Orquestra todos os componentes:
 * - ProcessingNode (nós de processamento)
 * - HomeostasisManager (regulação global)
 * - NucleoRaizAlma (núcleo central)
 * - InformationChannel (comunicação)
 */

import { EventBus } from '../EventBus';
import { ProcessingNode } from './ProcessingNode';
import { NucleoRaizAlma } from './NucleoRaizAlma';
import { homeostasisManager, HomeostasisManager } from './HomeostasisManager';
import { InformationChannel } from './InformationChannel';
import {
  type SystemMetrics,
  type InformationPacket,
  type ClareiraSnapshot,
  createInformationPacket,
} from './types';
import { VagusNerve } from './VagusNerve';
import { ClareiraSaraBridge } from './ClareiraSaraBridge';
import {
  NucleoApps,
  NucleoArmazenamento,
  NucleoConfiguracao,
  NucleoContexto,
  NucleoControleMotor,
  NucleoDecisao,
  NucleoEmocional,
  NucleoEstado,
  NucleoExecutor,
  NucleoKernel,
  NucleoLinguagem,
  NucleoMemoria,
  NucleoPercepcao,
  NucleoRaciocinio,
  NucleoRede,
  NucleoSemantica,
  NucleoSensores,
  NucleoUsuario,
  NucleoVigilancia,
} from './SpecializedNuclei';

/**
 * ProjetoClareira - Sistema Neural Bio-Inspirado
 */
class ProjetoClareiraSystem {
  private nucleoRaiz: NucleoRaizAlma;
  private primaryNodes: ProcessingNode[] = [];
  private secondaryNodes: ProcessingNode[] = [];
  private allNodes: ProcessingNode[] = [];
  private channels: InformationChannel[] = [];
  private homeostasis: HomeostasisManager;
  private vagus: VagusNerve;
  private saraBridge: ClareiraSaraBridge;
  
  private _initialized = false;
  private _running = false;
  private startTime = 0;
  private packetsInjected = 0;

  constructor() {
    // Criar núcleo central
    this.nucleoRaiz = new NucleoRaizAlma('NC-001');
    
    // Criar os 12 núcleos primários especializados preservando os contratos existentes
    const primaryClasses = [
      NucleoDecisao, NucleoPercepcao, NucleoEstado, NucleoExecutor,
      NucleoVigilancia, NucleoUsuario, NucleoConfiguracao, NucleoKernel,
      NucleoApps, NucleoRede, NucleoArmazenamento, NucleoContexto,
    ];
    for (let i = 0; i < primaryClasses.length; i++) {
      const Primary = primaryClasses[i];
      this.primaryNodes.push(new Primary(`NP-${String(i + 1).padStart(3, '0')}`));
    }

    // Quatro núcleos secundários por primário = 48 instâncias secundárias
    const secondaryClasses = [
      NucleoSemantica, NucleoSensores, NucleoMemoria, NucleoLinguagem,
      NucleoEmocional, NucleoRaciocinio, NucleoControleMotor,
    ];
    for (let i = 0; i < this.primaryNodes.length * 4; i++) {
      const Secondary = secondaryClasses[i % secondaryClasses.length];
      this.secondaryNodes.push(new Secondary(`MS-${String(i + 1).padStart(3, '0')}`));
    }
    
    // Consolidar todos os nós
    this.allNodes = [this.nucleoRaiz, ...this.primaryNodes, ...this.secondaryNodes];
    
    // Referência ao HomeostasisManager e integração autonômica
    this.homeostasis = homeostasisManager;
    this.vagus = new VagusNerve(this.homeostasis);
    this.saraBridge = new ClareiraSaraBridge();
    this.homeostasis.attachVagus(this.vagus);
    for (const node of this.allNodes) this.vagus.registerNode(node);

    EventBus.emit('module:registered', {
      id: 'projeto-clareira',
      name: 'ProjetoClareira',
    });

    console.log('[ProjetoClareira] Sistema criado com', this.allNodes.length, 'nós');
  }

  /**
   * Inicializa o sistema
   */
  initialize(): void {
    if (this._initialized) return;

    console.log('[ProjetoClareira] Inicializando sistema...');

    // Configurar canais de comunicação
    this.setupChannels();

    // Registrar nós no HomeostasisManager
    this.homeostasis.registerNodes(this.allNodes);

    this._initialized = true;
    
    EventBus.emit('system:init', { timestamp: Date.now() });
    
    console.log('[ProjetoClareira] Sistema inicializado');
  }

  /**
   * Configura canais de comunicação entre nós
   */
  private setupChannels(): void {
    // Central <-> Primary: 12 pares bidirecionais
    for (const node of this.primaryNodes) {
      const up = new InformationChannel(
        node.id,
        this.nucleoRaiz.id,
        'Central',
        1.5
      );
      const down = new InformationChannel(
        this.nucleoRaiz.id,
        node.id,
        'Primary',
        1.5
      );
      node.addOutputChannel(up);
      node.addInputChannel(down);
      this.nucleoRaiz.addInputChannel(up);
      this.nucleoRaiz.addOutputChannel(down);
      this.channels.push(up, down);
    }

    // Primary <-> Secondary: quatro secundários por primário
    const secondariesPerPrimary = 4;
    for (let i = 0; i < this.secondaryNodes.length; i++) {
      const secondary = this.secondaryNodes[i];
      const primary = this.primaryNodes[Math.floor(i / secondariesPerPrimary)];

      const up = new InformationChannel(
        secondary.id,
        primary.id,
        'Primary',
        1.0
      );
      const down = new InformationChannel(
        primary.id,
        secondary.id,
        'Secondary',
        1.0
      );
      secondary.addOutputChannel(up);
      secondary.addInputChannel(down);
      primary.addInputChannel(up);
      primary.addOutputChannel(down);
      this.channels.push(up, down);
    }

    console.log('[ProjetoClareira] Configurados', this.channels.length, 'canais');
  }

  /**
   * Inicia o sistema
   */
  start(): void {
    if (this._running) return;
    if (!this._initialized) this.initialize();

    console.log('[ProjetoClareira] Iniciando sistema...');

    this.startTime = Date.now();

    // Iniciar todos os nós
    for (const node of this.allNodes) {
      node.start();
    }

    // Iniciar homeostase e nervo vago
    this.homeostasis.start();
    this.vagus.start();

    this._running = true;

    EventBus.emit('system:ready', { 
      modules: this.allNodes.map(n => n.id) 
    });

    console.log('[ProjetoClareira] Sistema em execução');
  }

  /**
   * Para o sistema
   */
  stop(): void {
    if (!this._running) return;

    console.log('[ProjetoClareira] Parando sistema...');

    // Parar nervo vago e homeostase
    this.vagus.stop();
    this.homeostasis.stop();

    // Parar todos os nós
    for (const node of this.allNodes) {
      node.stop();
    }

    this._running = false;

    console.log('[ProjetoClareira] Sistema parado');
  }

  /**
   * Injeta estímulo externo no sistema
   */
  injectStimulus(
    data: string,
    criticality: number = 0.5,
    targetNodeId?: string
  ): boolean {
    if (!this._running) {
      console.warn('[ProjetoClareira] Sistema não está em execução');
      return false;
    }

    const packet = createInformationPacket(
      data,
      10.0,
      criticality,
      'Data',
      'EXTERNAL',
      targetNodeId,
      { injectedAt: Date.now() }
    );

    const target = targetNodeId
      ? this.allNodes.find(node => node.id === targetNodeId)
      : this.secondaryNodes.find(node => node.active)
        ?? this.primaryNodes.find(node => node.active)
        ?? (this.nucleoRaiz.active ? this.nucleoRaiz : undefined);

    if (!target || !target.active) return false;

    const success = target.receivePacket(packet);
    if (success) this.packetsInjected++;
    return success;
  }

  /**
   * Solicita decisão ao núcleo central
   */
  async requestDecision(
    action: string,
    context: string = 'general',
    priority: number = 0.5
  ): Promise<ReturnType<NucleoRaizAlma['requestDecision']>> {
    return this.nucleoRaiz.requestDecision(action, context, priority);
  }

  /**
   * Executa simulação por duração especificada
   */
  async runForDuration(durationMs: number = 5000): Promise<SystemMetrics> {
    if (durationMs < 0) throw new Error('CLAREIRA_DURATION_INVALID');
    if (!this._running) this.start();
    await new Promise(resolve => setTimeout(resolve, durationMs));
    return this.getMetrics();
  }

  /**
   * Compatibilidade retroativa sem geração de estímulos artificiais.
   */
  async runSimulation(durationMs: number = 5000): Promise<SystemMetrics> {
    return this.runForDuration(durationMs);
  }

  /**
   * Retorna métricas completas do sistema
   */
  getMetrics(): SystemMetrics {
    const homeostasisMetrics = this.homeostasis.getMetrics();
    const nodeMetrics = this.allNodes.map(n => n.getMetrics());
    
    const avgLoad = nodeMetrics.reduce((sum, m) => sum + (m.energy / 100), 0) / nodeMetrics.length;
    const avgTemp = nodeMetrics.reduce((sum, m) => sum + m.temperature, 0) / nodeMetrics.length;
    const totalPackets = nodeMetrics.reduce((sum, m) => sum + m.packetsProcessed, 0);

    return {
      totalNodes: this.allNodes.length,
      activeNodes: homeostasisMetrics.activeNodes,
      averageLoad: avgLoad,
      averageTemperature: avgTemp,
      globalStress: homeostasisMetrics.globalStress,
      turboActive: homeostasisMetrics.turboActive,
      packetsProcessed: totalPackets,
      tunelamentosRealizados: this.packetsInjected,
      vagalTone: this.vagus.snapshot().vagalTone,
      activeVagusBranches: this.vagus.snapshot().branches.filter(branch => branch.active).length,
      timestamp: Date.now(),
    };
  }

  getSnapshot(): ClareiraSnapshot {
    const status = this.getStatus();
    return {
      schemaVersion: '1.1.0',
      timestamp: Date.now(),
      blueprintVersion: '1.1.0',
      status: this._running ? 'RUNNING' : this._initialized ? 'INITIALIZED' : 'STOPPED',
      metrics: this.getMetrics(),
      nodes: status.nodes,
      channels: status.channels,
      homeostasis: status.homeostasis,
      vagus: this.vagus.snapshot(),
    };
  }

  persistSnapshot(): ClareiraSnapshot {
    const snapshot = this.getSnapshot();
    if (typeof localStorage === 'undefined') {
      throw new Error('CLAREIRA_LOCAL_PERSISTENCE_UNAVAILABLE');
    }
    localStorage.setItem('clareira.snapshot.v1', JSON.stringify(snapshot));
    EventBus.emit('memory:stored', {
      id: 'clareira-snapshot',
      type: 'clareira-state',
    });
    return snapshot;
  }

  loadSnapshot(): ClareiraSnapshot | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('clareira.snapshot.v1');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ClareiraSnapshot;
    } catch {
      throw new Error('CLAREIRA_SNAPSHOT_INVALID');
    }
  }

  exportMetricsCSV(): string {
    const snapshot = this.getSnapshot();
    const header = [
      'timestamp', 'node_id', 'level', 'active', 'energy',
      'temperature', 'processing_rate', 'queue_size', 'output_channels', 'input_channels',
    ];
    const rows = snapshot.nodes.map(node => [
      snapshot.timestamp,
      node.id,
      node.level,
      node.active,
      node.energy,
      node.temperature,
      node.processingRate,
      node.queueSize,
      node.outputChannels,
      node.inputChannels,
    ]);
    return [header, ...rows]
      .map(row => row.map(value => JSON.stringify(value)).join(','))
      .join('\n');
  }

  async syncStateToSara(correlationId?: string) {
    return this.saraBridge.syncState(this.getSnapshot(), correlationId);
  }

  async pullVagalCommandsFromSara(limit = 16) {
    return this.saraBridge.pullAndApplyVagalCommands(
      (nodeId, command, payload) => {
        const node = this.allNodes.find(item => item.id === nodeId);
        if (!node || !node.active) return false;
        node.applyVagalCommand(command, payload);
        return true;
      },
      limit,
    );
  }

  async dispatchVagalCommandToSara(
    nodeId: string,
    command: 'calm' | 'turbo' | 'reduce_thermal' | 'shutdown' | 'resume',
    payload: Record<string, unknown> = {},
    priority = 0.5,
    correlationId?: string,
  ) {
    return this.saraBridge.dispatchVagalCommand(
      nodeId,
      command,
      payload,
      priority,
      correlationId,
    );
  }

  /**
   * Retorna status do sistema
   */
  getStatus(): {
    initialized: boolean;
    running: boolean;
    uptime: number;
    nodes: ReturnType<ProcessingNode['getMetrics']>[];
    channels: ReturnType<InformationChannel['getMetrics']>[];
    homeostasis: ReturnType<HomeostasisManager['getMetrics']>;
    core: ReturnType<NucleoRaizAlma['getCoreMetrics']>;
  } {
    return {
      initialized: this._initialized,
      running: this._running,
      uptime: this._running ? Date.now() - this.startTime : 0,
      nodes: this.allNodes.map(n => n.getMetrics()),
      channels: this.channels.map(c => c.getMetrics()),
      homeostasis: this.homeostasis.getMetrics(),
      core: this.nucleoRaiz.getCoreMetrics(),
    };
  }

  get initialized(): boolean {
    return this._initialized;
  }

  get running(): boolean {
    return this._running;
  }
}

// Singleton instance
export const ProjetoClareira = new ProjetoClareiraSystem();

// Re-export types
export * from './types';
export { ProcessingNode } from './ProcessingNode';
export { NucleoRaizAlma } from './NucleoRaizAlma';
export { HomeostasisManager, homeostasisManager } from './HomeostasisManager';
export { InformationChannel } from './InformationChannel';
