/**
 * ResourceManager - Gerenciador Dinâmico de Recursos
 * 
 * Gerencia e aloca CPU, memória e I/O entre todos os módulos AGI.
 * Opera em PRIMEIRO PLANO CONTÍNUO:
 * - Priorização dinâmica baseada em carga e importância
 * - Fatiamento de tempo cooperativo igualitário
 * - Monitoramento de consumo por módulo
 * - Rebalanceamento automático
 */

export interface ModuleResourceProfile {
  moduleId: string;
  priority: number; // 0-1, dynamically adjusted
  cpuAllocation: number; // percentage 0-1
  memoryAllocation: number; // percentage 0-1
  ioWeight: number; // relative I/O priority
  lastExecutionMs: number;
  executionCount: number;
  isActive: boolean;
}

export interface ResourceSnapshot {
  timestamp: number;
  totalCpuUsage: number;
  totalMemoryUsage: number;
  moduleProfiles: Map<string, ModuleResourceProfile>;
  rebalanceCount: number;
  quantumSliceMs: number;
}

export interface ResourceMetrics {
  isRunning: boolean;
  modulesManaged: number;
  totalCpuUsage: number;
  totalMemoryUsage: number;
  rebalanceCount: number;
  avgQuantumSliceMs: number;
  hotModules: string[]; // modules consuming most resources
}

export class ResourceManager {
  private moduleProfiles: Map<string, ModuleResourceProfile> = new Map();
  private _running = false;
  private _rebalanceInterval: ReturnType<typeof setInterval> | null = null;
  private _monitorInterval: ReturnType<typeof setInterval> | null = null;
  private _rebalanceCount = 0;
  private _quantumSliceMs = 16; // ~60fps time slice
  
  private totalCpuUsage = 0;
  private totalMemoryUsage = 0;

  get isRunning(): boolean { return this._running; }

  /**
   * Register a module for resource management
   */
  registerModule(moduleId: string, basePriority: number = 0.5): void {
    this.moduleProfiles.set(moduleId, {
      moduleId,
      priority: basePriority,
      cpuAllocation: 1 / Math.max(1, this.moduleProfiles.size + 1),
      memoryAllocation: 1 / Math.max(1, this.moduleProfiles.size + 1),
      ioWeight: basePriority,
      lastExecutionMs: 0,
      executionCount: 0,
      isActive: true,
    });
    this.rebalanceAllocations();
  }

  /**
   * Start continuous resource monitoring and rebalancing
   */
  start(monitorIntervalMs: number = 1000, rebalanceIntervalMs: number = 3000): void {
    if (this._running) return;
    this._running = true;
    console.log('[ResourceManager] Gerenciador de recursos ATIVO');

    // Monitor loop - reads resource usage per module
    this._monitorInterval = setInterval(() => {
      this.monitorResources();
    }, monitorIntervalMs);

    // Rebalance loop - redistributes allocations
    this._rebalanceInterval = setInterval(() => {
      this.rebalanceAllocations();
    }, rebalanceIntervalMs);
  }

  stop(): void {
    if (this._monitorInterval) clearInterval(this._monitorInterval);
    if (this._rebalanceInterval) clearInterval(this._rebalanceInterval);
    this._monitorInterval = null;
    this._rebalanceInterval = null;
    this._running = false;
  }

  /**
   * Record execution metrics for a module
   */
  recordExecution(moduleId: string, executionMs: number): void {
    const profile = this.moduleProfiles.get(moduleId);
    if (profile) {
      profile.lastExecutionMs = executionMs;
      profile.executionCount++;
    }
  }

  /**
   * Adjust module priority dynamically
   */
  adjustPriority(moduleId: string, newPriority: number): void {
    const profile = this.moduleProfiles.get(moduleId);
    if (profile) {
      profile.priority = Math.max(0.1, Math.min(1.0, newPriority));
      profile.ioWeight = profile.priority;
    }
  }

  /**
   * Set module active/inactive for resource allocation
   */
  setModuleActive(moduleId: string, active: boolean): void {
    const profile = this.moduleProfiles.get(moduleId);
    if (profile) {
      profile.isActive = active;
      this.rebalanceAllocations();
    }
  }

  /**
   * Monitor resource usage across all modules
   */
  private monitorResources(): void {
    let totalCpu = 0;
    let totalMem = 0;

    for (const profile of this.moduleProfiles.values()) {
      if (!profile.isActive) continue;

      // Simulate CPU usage based on execution frequency and time
      const cpuUsage = Math.min(1, (profile.lastExecutionMs / this._quantumSliceMs) * profile.cpuAllocation);
      totalCpu += cpuUsage;

      // Simulate memory usage with gradual fluctuation
      const memDelta = (Math.random() - 0.5) * 0.02;
      profile.memoryAllocation = Math.max(0.01, Math.min(0.3, profile.memoryAllocation + memDelta));
      totalMem += profile.memoryAllocation;
    }

    this.totalCpuUsage = Math.min(1, totalCpu / Math.max(1, this.moduleProfiles.size));
    this.totalMemoryUsage = Math.min(1, totalMem);
  }

  /**
   * Rebalance resource allocations based on priority and load
   */
  private rebalanceAllocations(): void {
    this._rebalanceCount++;
    const activeModules = Array.from(this.moduleProfiles.values()).filter(m => m.isActive);
    if (activeModules.length === 0) return;

    const totalPriority = activeModules.reduce((sum, m) => sum + m.priority, 0);

    for (const module of activeModules) {
      // CPU allocation proportional to priority
      module.cpuAllocation = module.priority / totalPriority;
      
      // Quantum slice adjusted by load
      const loadFactor = module.lastExecutionMs > this._quantumSliceMs ? 0.8 : 1.2;
      module.cpuAllocation *= loadFactor;
    }

    // Normalize
    const totalAlloc = activeModules.reduce((sum, m) => sum + m.cpuAllocation, 0);
    if (totalAlloc > 0) {
      for (const module of activeModules) {
        module.cpuAllocation /= totalAlloc;
      }
    }

    // Adjust quantum slice based on module count
    this._quantumSliceMs = Math.max(8, Math.min(32, 16 * (13 / Math.max(1, activeModules.length))));
  }

  /**
   * Get resource metrics
   */
  getMetrics(): ResourceMetrics {
    const profiles = Array.from(this.moduleProfiles.values());
    const activeProfiles = profiles.filter(p => p.isActive);
    
    // Find hot modules (highest CPU allocation)
    const sorted = [...activeProfiles].sort((a, b) => b.cpuAllocation - a.cpuAllocation);
    const hotModules = sorted.slice(0, 3).map(p => p.moduleId);

    return {
      isRunning: this._running,
      modulesManaged: activeProfiles.length,
      totalCpuUsage: this.totalCpuUsage,
      totalMemoryUsage: this.totalMemoryUsage,
      rebalanceCount: this._rebalanceCount,
      avgQuantumSliceMs: this._quantumSliceMs,
      hotModules,
    };
  }

  /**
   * Get all module profiles
   */
  getAllProfiles(): ModuleResourceProfile[] {
    return Array.from(this.moduleProfiles.values());
  }

  /**
   * Get snapshot of current state
   */
  getSnapshot(): ResourceSnapshot {
    return {
      timestamp: Date.now(),
      totalCpuUsage: this.totalCpuUsage,
      totalMemoryUsage: this.totalMemoryUsage,
      moduleProfiles: new Map(this.moduleProfiles),
      rebalanceCount: this._rebalanceCount,
      quantumSliceMs: this._quantumSliceMs,
    };
  }
}
