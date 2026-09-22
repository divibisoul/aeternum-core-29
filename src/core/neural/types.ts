/**
 * PROJETO CLAREIRA - Tipos e Constantes
 * 
 * Arquitetura Neural Bio-Inspirada com Homeostase
 */

// ============= CONSTANTES DE SISTEMA =============

export const THERMAL_STRESS_WARN = 0.7;
export const THERMAL_STRESS_CRITICAL = 0.9;
export const STRESS_THRESHOLD_OPTIMAL = 3.0;
export const STRESS_THRESHOLD_WARNING = 10.0;
export const STRESS_THRESHOLD_CRITICAL = 20.0;
export const TURBO_MAX_STRESS = 8.0;
export const TURBO_MIN_ENERGY_SCORE = 70.0;
export const TURBO_COOLDOWN_SECONDS = 60;
export const TURBO_DURATION_SECONDS = 30;
export const TURBO_PROCESSING_MULTIPLIER = 2.0;
export const RECOVERY_STRESS_THRESHOLD = 8.0;
export const RECOVERY_MIN_FAILURE_MS = 10_000;
export const HOMEOSTASIS_CHECK_INTERVAL = 1000; // ms
export const MAX_QUEUE_SIZE = 100;
export const VAGUS_BRANCH_QUEUE_SIZE = 64;
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
  | 'Heartbeat'
  | 'Command'
  | 'Result'
  | 'Signal'
  | 'IPC';

export type VagalSignalType =
  | 'thermal_critical'
  | 'overload'
  | 'fault'
  | 'energy_low'
  | 'health'
  | 'state';

export interface VagalSignal {
  id: string;
  sourceNodeId: string;
  signalType: VagalSignalType;
  payload: Record<string, unknown>;
  priority: number;
  timestamp: number;
}

export interface VagalCommand {
  id: string;
  nodeId: string;
  command: 'calm' | 'turbo' | 'reduce_thermal' | 'shutdown' | 'resume';
  payload: Record<string, unknown>;
  priority: number;
  timestamp: number;
}

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
  vagalTone: number;
  activeVagusBranches: number;
  timestamp: number;
  redundantVagusBranches?: number;
  vagalSignalLatencyMs?: number;
  droppedPackets?: number;
  dropRate?: number;
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
