/**
 * PROJETO CLAREIRA — runtime neural integrado ao SOUL.
 *
 * Fusão do blueprint bio-inspirado com o runtime TypeScript existente.
 * A rede agora possui 20 classes funcionais do blueprint (1 raiz + 19
 * especializações), canais bidirecionais, homeostase, nervo vago,
 * snapshot/persistência local e métricas exportáveis.
 */
import { EventBus } from '../EventBus';
import { ProcessingNode } from './ProcessingNode';
import { NucleoRaizAlma } from './NucleoRaizAlma';
import { homeostasisManager, HomeostasisManager } from './HomeostasisManager';
import { InformationChannel } from './InformationChannel';
import { VagusNerve } from './VagusNerve';
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
import { type SystemMetrics, type ClareiraSnapshot, createInformationPacket } from './types';

class ProjetoClareiraSystem {
  private readonly nucleoRaiz: NucleoRaizAlma;
  private readonly primaryNodes: ProcessingNode[] = [];
  private readonly secondaryNodes: ProcessingNode[] = [];
  private readonly allNodes: ProcessingNode[] = [];
  private readonly channels: InformationChannel[] = [];
  private readonly homeostasis: HomeostasisManager;
  private readonly vagus: VagusNerve;

  private _initialized = false;
  private _running = false;
  private startTime = 0;
  private packetsInjected = 0;

  constructor() {
    this.nucleoRaiz = new NucleoRaizAlma('NC-001');

    const primaryClasses = [
      NucleoDecisao, NucleoPercepcao, NucleoEstado, NucleoExecutor,
      NucleoVigilancia, NucleoUsuario, NucleoConfiguracao, NucleoKernel,
      NucleoApps, NucleoRede, NucleoArmazenamento, NucleoContexto,
    ];
    for (let i = 0; i < primaryClasses.length; i += 1) {
      const node = new primaryClasses[i](`NP-${String(i + 1).padStart(3, '0')}`);
      this.primaryNodes.push(node);
    }

    const secondaryClasses = [
      NucleoSemantica, NucleoSensores, NucleoMemoria, NucleoLinguagem,
      NucleoEmocional, NucleoRaciocinio, NucleoControleMotor,
    ];
    for (let i = 0; i < secondaryClasses.length; i += 1) {
      const node = new secondaryClasses[i](`MS-${String(i + 1).padStart(3, '0')}`);
      this.secondaryNodes.push(node);
    }

    this.allNodes.push(this.nucleoRaiz, ...this.primaryNodes, ...this.secondaryNodes);

    this.homeostasis = homeostasisManager;
    this.homeostasis.registerNodes(this.allNodes);

    this.vagus = new VagusNerve(this.homeostasis);
    this.homeostasis.attachVagus(this.vagus);
    for (const node of this.allNodes) this.vagus.registerNode(node);

    EventBus.emit('module:registered', {
      id: 'projeto-clareira',
      name: 'ProjetoClareira',
      blueprintVersion: '1.1.0',
      nodeClasses: 20,
    });
  }

  initialize(): void {
    if (this._initialized) return;
    this.setupChannels();
    this._initialized = true;
    EventBus.emit('system:init', {
      timestamp: Date.now(),
      blueprintVersion: '1.1.0',
      nodes: this.allNodes.length,
      channels: this.channels.length,
    });
  }

  private setupChannels(): void {
    if (this.channels.length > 0) return;

    for (const node of this.primaryNodes) {
      const down = new InformationChannel(node.id, this.nucleoRaiz.id, 'Central', 1.5, 100);
      const up = new InformationChannel(this.nucleoRaiz.id, node.id, 'Primary', 1.5, 100);
      node.addOutputChannel(down);
      node.addInputChannel(up);
      this.nucleoRaiz.addInputChannel(down);
      this.nucleoRaiz.addOutputChannel(up);
      this.channels.push(down, up);
    }

    for (let i = 0; i < this.secondaryNodes.length; i += 1) {
      const secondary = this.secondaryNodes[i];
      const primary = this.primaryNodes[i % this.primaryNodes.length];
      const up = new InformationChannel(secondary.id, primary.id, 'Primary', 1, 60);
      const down = new InformationChannel(primary.id, secondary.id, 'Secondary', 1, 60);
      secondary.addOutputChannel(up);
      secondary.addInputChannel(down);
      primary.addInputChannel(up);
      primary.addOutputChannel(down);
      this.channels.push(up, down);
    }
  }

  start(): void {
    if (this._running) return;
    if (!this._initialized) this.initialize();

    this.homeostasis.start();
    this.vagus.start();
    for (const node of this.allNodes) node.start();

    this.startTime = Date.now();
    this._running = true;

    EventBus.emit('system:ready', {
      modules: this.allNodes.map(node => node.id),
      vagus: true,
      homeostasis: true,
    });
  }

  stop(): void {
    if (!this._running) return;
    for (const node of this.allNodes) node.stop();
    this.vagus.stop();
    this.homeostasis.stop();
    this._running = false;
  }

  injectStimulus(
    data: string,
    criticality = 0.5,
    targetNodeId?: string,
  ): boolean {
    if (!this._running || !data.trim()) return false;

    const packet = createInformationPacket(
      data,
      Math.max(1, data.length),
      criticality,
      'Data',
      'EXTERNAL',
      targetNodeId,
      { injectedAt: Date.now(), source: 'SOUL_RUNTIME' },
    );

    let target = targetNodeId
      ? this.allNodes.find(node => node.id === targetNodeId)
      : undefined;

    if (!target || !target.active) {
      target =
        this.secondaryNodes.find(node => node.active) ??
        this.primaryNodes.find(node => node.active) ??
        (this.nucleoRaiz.active ? this.nucleoRaiz : undefined);
    }

    if (!target) return false;
    const success = target.receivePacket(packet);
    if (success) this.packetsInjected += 1;
    return success;
  }

  async requestDecision(
    action: string,
    context = 'general',
    priority = 0.5,
  ): Promise<ReturnType<NucleoRaizAlma['requestDecision']>> {
    if (!this._running) this.start();
    return this.nucleoRaiz.requestDecision(action, context, priority);
  }

  async runForDuration(durationMs = 5000): Promise<SystemMetrics> {
    if (!this._running) this.start();
    if (durationMs < 0) throw new Error('CLAREIRA_DURATION_INVALID');
    await new Promise<void>(resolve => setTimeout(resolve, durationMs));
    return this.getMetrics();
  }

  /**
   * Compatibilidade retroativa.
   * Este método não injeta estímulos artificiais nem cria resultados sintéticos.
   */
  async runSimulation(durationMs = 5000): Promise<SystemMetrics> {
    return this.runForDuration(durationMs);
  }

  getMetrics(): SystemMetrics {
    const metrics = this.allNodes.map(node => node.getMetrics());
    const avgLoad = metrics.length
      ? metrics.reduce((sum, item) => sum + item.energy / Math.max(1, item.energyCapacity), 0) / metrics.length
      : 0;
    const avgTemp = metrics.length
      ? metrics.reduce((sum, item) => sum + item.temperature, 0) / metrics.length
      : 0;
    const vagus = this.vagus.snapshot();
    const homeo = this.homeostasis.getMetrics();

    return {
      totalNodes: metrics.length,
      activeNodes: metrics.filter(item => item.active).length,
      averageLoad: avgLoad,
      averageTemperature: avgTemp,
      globalStress: homeo.globalStress,
      turboActive: homeo.turboActive,
      packetsProcessed: metrics.reduce((sum, item) => sum + item.packetsProcessed, 0),
      tunelamentosRealizados: this.packetsInjected,
      vagalTone: vagus.vagalTone,
      activeVagusBranches: vagus.branches.filter(branch => branch.active).length,
      timestamp: Date.now(),
    };
  }

  getSnapshot(): ClareiraSnapshot {
    const metrics = this.getMetrics();
    return {
      schemaVersion: '1.1.0',
      timestamp: Date.now(),
      blueprintVersion: '1.1.0',
      status: this._running ? 'RUNNING' : this._initialized ? 'INITIALIZED' : 'STOPPED',
      metrics,
      nodes: this.allNodes.map(node => node.getMetrics()),
      channels: this.channels.map(channel => channel.getMetrics()),
      homeostasis: this.homeostasis.getMetrics(),
      vagus: this.vagus.snapshot(),
    };
  }

  persistSnapshot(): ClareiraSnapshot {
    const snapshot = this.getSnapshot();
    if (typeof localStorage === 'undefined') {
      throw new Error('CLAREIRA_LOCAL_PERSISTENCE_UNAVAILABLE');
    }
    localStorage.setItem('clareira.snapshot.v1', JSON.stringify(snapshot));
    EventBus.emit('clareira:snapshot:persisted', {
      schemaVersion: snapshot.schemaVersion,
      timestamp: snapshot.timestamp,
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
      'timestamp', 'node_id', 'level', 'active', 'energy', 'energy_capacity',
      'temperature', 'processing_rate', 'queue_size', 'input_channels', 'output_channels',
    ];
    const rows = snapshot.nodes.map(node => [
      snapshot.timestamp,
      node.id,
      node.level,
      node.active,
      node.energy,
      node.energyCapacity,
      node.temperature,
      node.processingRate,
      node.queueSize,
      node.inputChannels,
      node.outputChannels,
    ]);
    return [header, ...rows]
      .map(row => row.map(value => JSON.stringify(value)).join(','))
      .join('\n');
  }

  getStatus() {
    return {
      initialized: this._initialized,
      running: this._running,
      uptime: this._running ? Date.now() - this.startTime : 0,
      nodes: this.allNodes.map(node => node.getMetrics()),
      channels: this.channels.map(channel => channel.getMetrics()),
      homeostasis: this.homeostasis.getMetrics(),
      vagus: this.vagus.snapshot(),
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

export const ProjetoClareira = new ProjetoClareiraSystem();

export * from './types';
export { ProcessingNode } from './ProcessingNode';
export { NucleoRaizAlma } from './NucleoRaizAlma';
export { HomeostasisManager, homeostasisManager } from './HomeostasisManager';
export { InformationChannel } from './InformationChannel';
export { VagusNerve } from './VagusNerve';
export * from './SpecializedNuclei';
