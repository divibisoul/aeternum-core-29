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
import { VagusNerve } from './VagusNerve';
import { ClareiraSaraBridge } from './ClareiraSaraBridge';
import { ClareiraAndroidBridge } from './ClareiraAndroidBridge';
import { InputTransducer } from './InputTransducer';
import {
  type SystemMetrics,
  type InformationPacket,
  type ClareiraSnapshot,
  type ClareiraDeviceState,
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
  private vagus: VagusNerve;
  private saraBridge: ClareiraSaraBridge;
  private readonly androidBridge = new ClareiraAndroidBridge();
  private readonly inputTransducer = new InputTransducer();
  
  private _initialized = false;
  private _running = false;
  private startTime = 0;
  private packetsInjected = 0;

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

    void EventBus.emit('clareira.stopped', { at: Date.now() });
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
        target = this.allNodes[Math.floor(Math.random() * this.allNodes.length)];
      }
    } else {
      // Selecionar aleatoriamente
      target = this.allNodes[Math.floor(Math.random() * this.allNodes.length)];
    }

    const success = target.receivePacket(packet);
    
    if (success) {
      this.packetsInjected++;
      console.log(`[ProjetoClareira] Estímulo injetado em ${target.id}`);
    }

    return success;
  }

  /**
   * Recebe um InformationPacket criado por uma fronteira federada.
   * O pacote existente é preservado; nenhuma nova identidade é gerada.
   */
  injectPacket(packet: InformationPacket): boolean {
    if (!this._running) {
      console.warn('[ProjetoClareira] Sistema não está em execução');
      return false;
    }

    let target: ProcessingNode | undefined;
    if (packet.destinationHint) {
      target = this.allNodes.find(n => n.id === packet.destinationHint);
      if (!target) {
        const correlationId = String(packet.metadata?.correlationId ?? packet.id);
        void EventBus.emit('clareira.packet.dropped', {
          correlationId,
          reason: `DESTINATION_NOT_FOUND:${packet.destinationHint}`,
        });
        return false;
      }
    } else {
      let hash = 0;
      const packetId = String(packet.id);
      for (let i = 0; i < packetId.length; i++) {
        hash = ((hash << 5) - hash) + packetId.charCodeAt(i);
        hash |= 0;
      }
      const targetIndex = Math.abs(hash) % this.allNodes.length;
      target = this.allNodes[targetIndex];
    }
    if (!target) return false;

    const correlationId = String(packet.metadata?.correlationId ?? packet.id);
    const success = target.receivePacket(packet);
    if (success) {
      this.packetsInjected++;
      void EventBus.emit('clareira.packet.ingested', { correlationId, sourceId: packet.sourceId });
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
   * Executa simulação por duração especificada
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

    const vagus = this.vagus.snapshot();
    return {
      totalNodes: this.allNodes.length,
      activeNodes: homeostasisMetrics.activeNodes,
      averageLoad: avgLoad,
      averageTemperature: avgTemp,
      globalStress: homeostasisMetrics.globalStress,
      turboActive: homeostasisMetrics.turboActive,
      packetsProcessed: totalPackets,
      tunelamentosRealizados: this.packetsInjected,
      vagalTone: vagus.vagalTone,
      activeVagusBranches: vagus.activeNodeBranches,
      redundantVagusBranches: vagus.redundantBranches,
      vagalSignalLatencyMs: vagus.observedLatencyMs ?? undefined,
      droppedPackets: this.channels.reduce((sum, channel) => sum + channel.getMetrics().packetsDropped, 0),
      dropRate: (() => {
        const transmitted = this.channels.reduce((sum, channel) => sum + channel.getMetrics().packetsTransmitted, 0);
        const dropped = this.channels.reduce((sum, channel) => sum + channel.getMetrics().packetsDropped, 0);
        return transmitted + dropped > 0 ? dropped / (transmitted + dropped) : 0;
      })(),
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

  async runForDuration(durationMs: number = 5000): Promise<SystemMetrics> {
    if (durationMs < 0) throw new Error('CLAREIRA_DURATION_INVALID');
    if (!this._running) this.start();
    await new Promise(resolve => setTimeout(resolve, durationMs));
    return this.getMetrics();
  }

  updateDeviceState(state: ClareiraDeviceState): void {
    this.homeostasis.updateDeviceState(state);
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
      deviceState: this.homeostasis.getDeviceState() ?? undefined,
    };
  }

  persistSnapshot(): ClareiraSnapshot {
    const snapshot = this.getSnapshot();
    if (typeof localStorage === 'undefined') throw new Error('CLAREIRA_LOCAL_PERSISTENCE_UNAVAILABLE');
    localStorage.setItem('clareira.snapshot.v1', JSON.stringify(snapshot));
    EventBus.emit('memory:stored', { id: 'clareira-snapshot', type: 'clareira-state' });
    return snapshot;
  }

  loadSnapshot(): ClareiraSnapshot | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('clareira.snapshot.v1');
    if (!raw) return null;
    try { return JSON.parse(raw) as ClareiraSnapshot; } catch { throw new Error('CLAREIRA_SNAPSHOT_INVALID'); }
  }

  exportMetricsCSV(): string {
    const snapshot = this.getSnapshot();
    const header = ['timestamp','node_id','level','active','energy','temperature','processing_rate','queue_size','output_channels','input_channels'];
    const rows = snapshot.nodes.map(node => [
      snapshot.timestamp, node.nodeId, node.level, node.active, node.energy, node.temperature,
      node.processingRate, node.queueSize, node.outputChannels, node.inputChannels,
    ]);
    return [header.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  async getAndroidSnapshot(timeoutMs = 5000) { return this.androidBridge.snapshot(timeoutMs); }
  async setAndroidBrightness(percent: number, timeoutMs = 5000) { return this.androidBridge.setBrightness(percent, timeoutMs); }
  async requestAndroidKillBackground(packageName: string, timeoutMs = 5000) { return this.androidBridge.killBackground(packageName, timeoutMs); }
  async openAndroidWifiPanel(timeoutMs = 5000) { return this.androidBridge.openWifiPanel(timeoutMs); }
  async requestAndroidBluetoothEnable(timeoutMs = 5000) { return this.androidBridge.requestBluetoothEnable(timeoutMs); }
  async openAndroidAirplaneSettings(timeoutMs = 5000) { return this.androidBridge.openAirplaneSettings(timeoutMs); }

  async syncStateToSara(correlationId?: string) { return this.saraBridge.syncState(this.getSnapshot(), correlationId); }
  async pullVagalCommandsFromSara(limit = 16) {
    return this.saraBridge.pullAndApplyVagalCommands(
      (nodeId, command, payload) => {
        const node = this.allNodes.find(item => item.id === nodeId);
        if (!node) return false;
        node.applyVagalCommand(command, payload);
        return true;
      },
      limit,
    );
  }
  async auditStateThroughSara(correlationId?: string) { return this.saraBridge.auditLatestState(correlationId); }
  async dispatchVagalCommandToSara(nodeId: string, command: import('./types').VagalCommand['command'], payload: Record<string, unknown> = {}, priority = 0.5, correlationId?: string) {
    return this.saraBridge.dispatchVagalCommand(nodeId, command, payload, priority, correlationId);
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
