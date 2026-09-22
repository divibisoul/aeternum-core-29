/**
 * PROJETO CLAREIRA - Tipos e Contratos
 *
 * Arquitetura Neural Bio-Inspirada com Homeostase e Nervo Vago.
 */

export const THERMAL_STRESS_WARN = 0.7;
export const THERMAL_STRESS_CRITICAL = 0.9;
export const TURBO_MAX_STRESS = 3.0;
export const TURBO_COOLDOWN_SECONDS = 30;
export const TURBO_DURATION_SECONDS = 10;
export const TURBO_PROCESSING_MULTIPLIER = 2.0;
export const RECOVERY_STRESS_THRESHOLD = 1.0;
export const RECOVERY_CHANCE_PER_CHECK = 0.3;
export const HOMEOSTASIS_CHECK_INTERVAL = 1000;
export const MAX_QUEUE_SIZE = 100;
export const REPORT_INTERVAL = 2000;
export const PROCESS_TICK_INTERVAL = 100;

export type NodeLevel = 'Central' | 'Primary' | 'Secondary' | 'Peripheral';

export const LEVEL_MAP: Record<NodeLevel, number> = {
  Central: 0,
  Primary: 1,
  Secondary: 2,
  Peripheral: 3,
};

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

export interface NodeState {
  nodeId: string;
  level: NodeLevel;
  loadRatio: number;
  temperature: number;
  active: boolean;
  processingRate: number;
  timestamp: number;
}

export interface HomeostasisReport {
  globalStress: number;
  turboActive: boolean;
  nodeStates: Map<string, NodeState>;
  inactiveNodes: number;
  timestamp: number;
}

export interface DecisionResult {
  action: string;
  parameters: Record<string, unknown>;
  confidence: number;
}

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

export function createInformationPacket(
  data: string,
  informationalValue: number,
  criticality: number,
  packetType: PacketType,
  sourceId: string,
  destinationHint?: string,
  metadata: Record<string, unknown> = {},
): InformationPacket {
  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? `pkt_${crypto.randomUUID()}`
    : `pkt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    data,
    informationalValue: Math.max(0, informationalValue),
    criticality: Math.max(0, Math.min(1, criticality)),
    packetType,
    sourceId,
    destinationHint,
    timestamp: Date.now(),
    metadata,
  };
}
