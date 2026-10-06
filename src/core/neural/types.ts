/**
 * PROJETO CLAREIRA - Tipos e Constantes
 * 
 * Arquitetura Neural Bio-Inspirada com Homeostase
 */

// ============= CONSTANTES DE SISTEMA =============

export const THERMAL_STRESS_WARN = 0.7;
export const THERMAL_STRESS_CRITICAL = 0.9;
export const TURBO_MAX_STRESS = 3.0;
export const TURBO_COOLDOWN_SECONDS = 30;
export const TURBO_DURATION_SECONDS = 10;
export const TURBO_PROCESSING_MULTIPLIER = 2.0;
export const RECOVERY_STRESS_THRESHOLD = 1.0;
export const RECOVERY_CHANCE_PER_CHECK = 0.3;
export const HOMEOSTASIS_CHECK_INTERVAL = 1000; // ms
export const MAX_QUEUE_SIZE = 100;
export const REPORT_INTERVAL = 2000; // ms

// ============= TIPOS E INTERFACES =============

/**
 * Níveis hierárquicos do sistema
 */
export type NodeLevel = 'Central' | 'Primary' | 'Secondary' | 'Peripheral';

export const LEVEL_MAP: Record<NodeLevel, number> = {
  'Central': 0,
  'Primary': 1,
  'Secondary': 2,
  'Peripheral': 3,
};

/**
 * Tipos de pacotes de informação
 */
export type PacketType = 
  | 'Data'
  | 'StateReport'
  | 'DecisionRequest'
  | 'DecisionResponse'
  | 'Control'
  | 'Heartbeat';

/**
 * Pacote de Informação - Unidade básica de comunicação
 */
export interface InformationPacket {
  id: string;
  data: string;
  informationalValue: number;
  criticality: number;
  packetType: PacketType;
  sourceId: string;
  destinationHint?: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

/**
 * Estado de um nó de processamento
 */
export interface NodeState {
  nodeId: string;
  level: NodeLevel;
  loadRatio: number;
  temperature: number;
  active: boolean;
  processingRate: number;
  timestamp: number;
}

/**
 * Relatório de homeostase
 */
export interface HomeostasisReport {
  globalStress: number;
  turboActive: boolean;
  nodeStates: Map<string, NodeState>;
  inactiveNodes: number;
  timestamp: number;
}

/**
 * Resultado de decisão
 */
export interface DecisionResult {
  action: string;
  parameters: Record<string, unknown>;
  confidence: number;
}

/**
 * Métricas do sistema
 */
export interface SystemMetrics {
  totalNodes: number;
  activeNodes: number;
  averageLoad: number;
  averageTemperature: number;
  globalStress: number;
  turboActive: boolean;
  packetsProcessed: number;
  tunelamentosRealizados: number;
  vagalTone?: number;
  activeVagusBranches?: number;
  redundantVagusBranches?: number;
  vagalSignalLatencyMs?: number;
  droppedPackets?: number;
  dropRate?: number;
  timestamp: number;
}

/**
 * Factory para criar pacotes de informação
 */
export function createInformationPacket(
  data: string,
  informationalValue: number,
  criticality: number,
  packetType: PacketType,
  sourceId: string,
  destinationHint?: string,
  metadata: Record<string, unknown> = {}
): InformationPacket {
  return {
    id: `pkt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    data,
    informationalValue,
    criticality,
    packetType,
    sourceId,
    destinationHint,
    timestamp: Date.now(),
    metadata,
  };
}


export interface ClareiraDeviceState {
  batteryPercent: number;
  charging: boolean;
  batteryTemperatureC: number | null;
  screenOn: boolean;
  network: string;
  shizukuStatus: string;
  timestamp: number;
  cpuFreqMhz?: number | null;
  ramUsedMb?: number | null;
  ramTotalMb?: number | null;
  foregroundPackage?: string | null;
  wifiEnabled?: boolean;
  bluetoothEnabled?: boolean;
}

export interface ClareiraSnapshot {
  schemaVersion: '1.1.0';
  timestamp: number;
  blueprintVersion: string;
  status: 'INITIALIZED' | 'RUNNING' | 'STOPPED';
  metrics: SystemMetrics;
  nodes: ReturnType<import('./ProcessingNode').ProcessingNode['getMetrics']>[];
  channels: ReturnType<import('./InformationChannel').InformationChannel['getMetrics']>[];
  homeostasis: ReturnType<import('./HomeostasisManager').HomeostasisManager['getMetrics']>;
  vagus: ReturnType<import('./VagusNerve').VagusNerve['snapshot']>;
  deviceState?: ClareiraDeviceState;
}


/** Bounded queue capacity per Vagus branch; aligned with the 64-item tick batch and 16-way global ceiling. */
export const VAGUS_BRANCH_QUEUE_SIZE = 32;
/** Autonomic Vagus tick period; kept above the tone-control 100ms observation floor. */
export const VAGUS_TICK_INTERVAL_MS = 100;
