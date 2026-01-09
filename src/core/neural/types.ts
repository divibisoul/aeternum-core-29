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
