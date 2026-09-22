/**
 * PROJETO CLAREIRA — Nervo Vago Digital
 *
 * Transporte autonômico local, prioritário e bidirecional.
 * Não simula Android/firmware: transporta estados reais produzidos pelo
 * runtime Clareira e deixa integrações externas em adaptadores explícitos.
 */
import type { VagalCommand, VagalSignal } from './types';
import { VAGUS_BRANCH_QUEUE_SIZE } from './types';
import type { HomeostasisManager } from './HomeostasisManager';
import type { ProcessingNode } from './ProcessingNode';

export interface VagusBranchMetrics {
  nodeId: string;
  active: boolean;
  afferentPending: number;
  efferentPending: number;
  signalsIn: number;
  signalsOut: number;
}

class VagusBranch {
  readonly node: ProcessingNode;
  readonly afferentQueue: VagalSignal[] = [];
  readonly efferentQueue: VagalCommand[] = [];

  active = true;
  signalsIn = 0;
  signalsOut = 0;

  constructor(node: ProcessingNode) {
    this.node = node;
  }

  snapshot(): VagusBranchMetrics {
    return {
      nodeId: this.node.id,
      active: this.active,
      afferentPending: this.afferentQueue.length,
      efferentPending: this.efferentQueue.length,
      signalsIn: this.signalsIn,
      signalsOut: this.signalsOut,
    };
  }
}

class VagusPlexus {
  private readonly primary = new Map<string, VagusBranch>();
  private readonly backups = new Map<string, VagusBranch[]>();

  register(branch: VagusBranch): void {
    const nodeId = branch.node.id;
    if (!this.primary.has(nodeId)) {
      this.primary.set(nodeId, branch);
      return;
    }
    const list = this.backups.get(nodeId) ?? [];
    list.push(branch);
    this.backups.set(nodeId, list);
  }

  getActive(nodeId: string): VagusBranch | null {
    const main = this.primary.get(nodeId);
    if (main?.active) return main;
    return (this.backups.get(nodeId) ?? []).find(branch => branch.active) ?? null;
  }

  all(): VagusBranch[] {
    return [...this.primary.values(), ...[...this.backups.values()].flat()];
  }
}

export class VagusNerve {
  readonly name = 'VagusNerve';
  readonly version = '1.0.0';
  private readonly plexus = new VagusPlexus();
  private readonly afferentQueue: VagalSignal[] = [];
  private readonly efferentQueue: Array<{ nodeId: string; command: VagalCommand }> = [];
  private interval: ReturnType<typeof setInterval> | null = null;
  private _active = false;
  private _vagalTone = 0.5;
  private lastToneUpdate = 0;
  private signalsIn = 0;
  private signalsOut = 0;
  private observedLatencyTotalMs = 0;
  private observedLatencySamples = 0;

  constructor(private readonly homeostasis: HomeostasisManager) {}

  get active(): boolean {
    return this._active;
  }

  get vagalTone(): number {
    return this._vagalTone;
  }

  registerNode(node: ProcessingNode): void {
    if (this.plexus.getActive(node.id)) return;
    const branch = new VagusBranch(node);
    const backup = new VagusBranch(node);
    this.plexus.register(branch);
    this.plexus.register(backup);
    node.setVagusAfferentReporter((signalType, payload, priority = 0.5) => {
      this.publishAfferent(node.id, signalType, payload, priority);
    });
  }

  publishAfferent(
    sourceNodeId: string,
    signalType: VagalSignal['signalType'],
    payload: Record<string, unknown>,
    priority = 0.5,
  ): void {
    const branch = this.plexus.getActive(sourceNodeId);
    if (!branch) return;
    const signal: VagalSignal = {
      id: `vagal_in_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceNodeId,
      signalType,
      payload,
      priority: Math.max(0, Math.min(1, priority)),
      timestamp: Date.now(),
    };
    if (branch.afferentQueue.length >= VAGUS_BRANCH_QUEUE_SIZE || this.afferentQueue.length >= VAGUS_BRANCH_QUEUE_SIZE * 16) {
      return;
    }
    branch.afferentQueue.push(signal);
    branch.signalsIn += 1;
    this.afferentQueue.push(signal);
    this.signalsIn += 1;
  }

  sendEfferent(
    nodeId: string,
    command: VagalCommand['command'],
    payload: Record<string, unknown> = {},
    priority = 0.5,
  ): boolean {
    const branch = this.plexus.getActive(nodeId);
    if (!branch) return false;
    const cmd: VagalCommand = {
      id: `vagal_out_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      nodeId,
      command,
      payload,
      priority: Math.max(0, Math.min(1, priority)),
      timestamp: Date.now(),
    };
    if (branch.efferentQueue.length >= VAGUS_BRANCH_QUEUE_SIZE || this.efferentQueue.length >= VAGUS_BRANCH_QUEUE_SIZE * 16) {
      return false;
    }
    branch.efferentQueue.push(cmd);
    this.efferentQueue.push({ nodeId, command: cmd });
    return true;
  }

  start(): void {
    if (this.interval) return;
    this._active = true;
    this.interval = setInterval(() => this.tick(), 20);
  }

  stop(): void {
    this._active = false;
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }

  private tick(): void {
    const afferentBatch = this.takePriority(this.afferentQueue, 64);
    for (const signal of afferentBatch) {
      for (const branch of this.plexus.all()) {
        const index = branch.afferentQueue.findIndex(item => item.id === signal.id);
        if (index >= 0) {
          branch.afferentQueue.splice(index, 1);
          break;
        }
      }
      this.observedLatencyTotalMs += Math.max(0, Date.now() - signal.timestamp);
      this.observedLatencySamples += 1;
      this.homeostasis.receiveVagalAfferent(signal);
    }

    const efferentBatch = this.takePriority(
      this.efferentQueue,
      64,
      item => item.command.priority,
    );
    for (const item of efferentBatch) {
      const branch = this.plexus.getActive(item.nodeId);
      if (!branch) continue;
      const index = branch.efferentQueue.findIndex(command => command.id === item.command.id);
      if (index < 0) continue;
      const [command] = branch.efferentQueue.splice(index, 1);
      if (!command) continue;
      branch.signalsOut += 1;
      this.signalsOut += 1;
      branch.node.applyVagalCommand(command.command, command.payload);
    }

    this.adjustTone();
  }

  private adjustTone(): void {
    const now = Date.now();
    if (now - this.lastToneUpdate < 100) return;
    this.lastToneUpdate = now;
    const stress = this.homeostasis.getMetrics().globalStress;
    const target = stress >= 6 ? 0.95 : stress >= 2 ? 0.75 : stress <= 0.5 ? 0.15 : 0.5;
    this._vagalTone = this._vagalTone * 0.7 + target * 0.3;
  }

  private takePriority<T>(
    list: T[],
    limit: number,
    priority: (item: T) => number = item => {
      const candidate = item as unknown as VagalSignal;
      return candidate.priority;
    },
  ): T[] {
    if (list.length === 0) return [];
    list.sort((a, b) => priority(b) - priority(a));
    return list.splice(0, limit);
  }

  snapshot(): {
    name: string;
    version: string;
    active: boolean;
    vagalTone: number;
    queuedAfferent: number;
    queuedEfferent: number;
    signalsIn: number;
    signalsOut: number;
    branches: VagusBranchMetrics[];
  } {
    const branches = this.plexus.all();
    const uniqueNodeIds = new Set(
      branches.filter(branch => branch.active).map(branch => branch.node.id),
    );

    return {
      name: this.name,
      version: this.version,
      active: this._active,
      vagalTone: Number(this._vagalTone.toFixed(6)),
      queuedAfferent: this.afferentQueue.length,
      queuedEfferent: this.efferentQueue.length,
      signalsIn: this.signalsIn,
      signalsOut: this.signalsOut,
      branches: branches.map(branch => branch.snapshot()),
      activeNodeBranches: uniqueNodeIds.size,
      redundantBranches: Math.max(0, branches.length - uniqueNodeIds.size),
      observedLatencyMs: this.observedLatencySamples > 0
        ? Number((this.observedLatencyTotalMs / this.observedLatencySamples).toFixed(3))
        : null,
    };
  }
}

export type { VagusBranch };
