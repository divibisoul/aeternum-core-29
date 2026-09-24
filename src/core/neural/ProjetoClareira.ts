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
  createInformationPacket,
} from './types';

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
  
  private _initialized = false;
  private _running = false;
  private startTime = 0;
  private packetsInjected = 0;
  private stimulusSequence = 0;

  constructor() {
    // Criar núcleo central
    this.nucleoRaiz = new NucleoRaizAlma('NC-001');
    
    // Criar nós primários
    for (let i = 1; i <= 3; i++) {
      this.primaryNodes.push(new ProcessingNode(`NP-${i.toString().padStart(3, '0')}`, 'Primary'));
    }
    
    // Criar nós secundários
    for (let i = 1; i <= 5; i++) {
      this.secondaryNodes.push(new ProcessingNode(`NS-${i.toString().padStart(3, '0')}`, 'Secondary'));
    }
    
    // Consolidar todos os nós
    this.allNodes = [this.nucleoRaiz, ...this.primaryNodes, ...this.secondaryNodes];
    
    // Referência ao HomeostasisManager
    this.homeostasis = homeostasisManager;

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
    // Conectar nós primários ao núcleo central
    for (const node of this.primaryNodes) {
      const channel = new InformationChannel(
        node.id,
        this.nucleoRaiz.id,
        'Central',
        1.5 // Alta bandwidth para primários
      );
      
      node.addOutputChannel(channel);
      this.channels.push(channel);
    }

    // Conectar nós secundários aos primários
    for (let i = 0; i < this.secondaryNodes.length; i++) {
      const secondary = this.secondaryNodes[i];
      const primaryIndex = i % this.primaryNodes.length;
      const primary = this.primaryNodes[primaryIndex];
      
      const channel = new InformationChannel(
        secondary.id,
        primary.id,
        'Primary',
        1.0
      );
      
      secondary.addOutputChannel(channel);
      this.channels.push(channel);
    }

    // Conectar núcleo central aos primários (bidirecional)
    for (const node of this.primaryNodes) {
      const reverseChannel = new InformationChannel(
        this.nucleoRaiz.id,
        node.id,
        'Primary',
        1.5
      );
      
      this.nucleoRaiz.addOutputChannel(reverseChannel);
      this.channels.push(reverseChannel);
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

    // Iniciar homeostase
    this.homeostasis.start();

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

    // Parar homeostase
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

    // Selecionar nó alvo
    let target: ProcessingNode;
    
    if (targetNodeId) {
      const found = this.allNodes.find(n => n.id === targetNodeId);
      if (found) {
        target = found;
      } else {
        console.warn(`[ProjetoClareira] Nó alvo inexistente: ${targetNodeId}`);
        return false;
      }
    } else {
      // Roteamento determinístico para produção: round-robin sobre nós ativos.
      const activeNodes = this.allNodes.filter((node) => node.active);
      if (activeNodes.length === 0) return false;
      target = activeNodes[this.stimulusSequence % activeNodes.length];
      this.stimulusSequence = (this.stimulusSequence + 1) % activeNodes.length;
    }

    const success = target.receivePacket(packet);
    
    if (success) {
      this.packetsInjected++;
      console.log(`[ProjetoClareira] Estímulo injetado em ${target.id}`);
    }

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
   * Legacy test harness. This method is retained for compatibility and is
   * NOT part of the production execution path or production telemetry.
   * @deprecated Use the live runtime and getMetrics/getStatus for production.
   */
  async runSimulation(durationMs: number = 5000): Promise<SystemMetrics> {
    if (!this._running) {
      this.start();
    }

    const startTime = Date.now();
    
    // Injetar estímulos periódicos
    const stimulusInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        this.injectStimulus(
          `Stimulus at ${Date.now()}`,
          Math.random(),
        );
      }
    }, 200);

    // Aguardar duração
    await new Promise(resolve => setTimeout(resolve, durationMs));

    clearInterval(stimulusInterval);

    return this.getMetrics();
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
      timestamp: Date.now(),
    };
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
