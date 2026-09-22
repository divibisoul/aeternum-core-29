/**
 * NUCLEO RAIZ ALMA - Núcleo Central de Processamento
 * 
 * Implementação CRÍTICA do NucleoRaizAlma
 * O núcleo central que processa comandos e toma decisões
 */

import { EventBus } from '../EventBus';
import { ProcessingNode } from './ProcessingNode';
import {
  type InformationPacket,
  type DecisionResult,
  type PacketType,
  createInformationPacket,
} from './types';

/**
 * NucleoRaizAlma - Núcleo Central (nível Central)
 * 
 * Processa DecisionRequest e gera DecisionResponse
 */
export class NucleoRaizAlma extends ProcessingNode {
  private decisionQueue: InformationPacket[] = [];
  private decisionsProcessed = 0;
  private avgDecisionTime = 0;

  constructor(id: string = 'NC-001') {
    super(id, 'Central');

    console.log(`[NucleoRaizAlma] Núcleo central ${id} inicializado`);
  }

  /**
   * Processamento específico do núcleo central
   */
  protected nodeSpecificProcessing(packet: InformationPacket): {
    data: string;
    packetType: PacketType;
    destinationHint?: string;
    criticality: number;
    metadata: Record<string, unknown>;
  } | null {
    if (packet.packetType === 'DecisionRequest') {
      const startTime = Date.now();
      
      // Parse data
      let requestData: Record<string, unknown> = {};
      try {
        requestData = JSON.parse(packet.data);
      } catch {
        requestData = { rawData: packet.data };
      }

      // Processar solicitação de decisão
      const decision = this.makeDecision(requestData);
      
      // Atualizar métricas
      const decisionTime = Date.now() - startTime;
      this.decisionsProcessed++;
      this.avgDecisionTime += (decisionTime - this.avgDecisionTime) / this.decisionsProcessed;

      console.log(`[NucleoRaizAlma] Decisão tomada em ${decisionTime}ms:`, decision.action);

      return {
        data: JSON.stringify(decision),
        packetType: 'DecisionResponse',
        destinationHint: packet.sourceId,
        criticality: decision.confidence,
        metadata: {
          requestId: packet.metadata.requestId,
          processingTime: decisionTime,
        },
      };
    }

    if (packet.packetType === 'StateReport') {
      // Agregar estados para visão global
      this.aggregateState(packet);
      return null;
    }

    // Outros tipos de pacotes - processar normalmente
    return super.nodeSpecificProcessing(packet);
  }

  /**
   * Lógica avançada de tomada de decisão
   */
  private makeDecision(data: Record<string, unknown>): DecisionResult {
    // Fatores contextuais
    const thermalFactor = Math.min(1.0, Math.max(0.0, this.thermalSensorReading / 0.45));
    const loadFactor = this.currentEnergy / this.energyCapacity;
    
    // Obter prioridade do request
    const priority = typeof data.priority === 'number' ? data.priority : 0.5;
    const action = typeof data.action === 'string' ? data.action : 'process';
    const context = typeof data.context === 'string' ? data.context : 'general';

    // Lógica de decisão baseada em contexto
    let adjustedPriority = priority * (1 - thermalFactor);
    let energyAllocation = loadFactor * 0.8;
    let recommendedAction = action;
    let confidence = 0.8;

    // Ajustes baseados em contexto
    switch (context) {
      case 'urgent':
        adjustedPriority = Math.min(1.0, priority * 1.5);
        energyAllocation = Math.min(1.0, loadFactor);
        confidence = 0.9;
        break;
      
      case 'optimization':
        recommendedAction = 'optimize';
        adjustedPriority = priority * (1 - thermalFactor * 0.5);
        energyAllocation = loadFactor * 0.6;
        confidence = 0.85;
        break;
      
      case 'creative':
        recommendedAction = 'explore';
        adjustedPriority = priority;
        energyAllocation = loadFactor * 0.9;
        confidence = 0.7; // Menos certeza em decisões criativas
        break;
      
      case 'analytical':
        recommendedAction = 'analyze';
        adjustedPriority = priority * (1 + loadFactor * 0.2);
        energyAllocation = loadFactor * 0.7;
        confidence = 0.95;
        break;
      
      default:
        // Decisão balanceada
        recommendedAction = 'adjust_processing';
        break;
    }

    // Verificar condições de stress
    if (this.thermalSensorReading > 0.7) {
      recommendedAction = 'throttle';
      confidence *= 0.9;
    }

    if (this.currentEnergy < 30) {
      energyAllocation *= 0.5;
      confidence *= 0.8;
    }

    return {
      action: recommendedAction,
      parameters: {
        priority: adjustedPriority,
        energy_allocation: energyAllocation,
        thermal_factor: thermalFactor,
        load_factor: loadFactor,
        context,
        original_action: action,
      },
      confidence,
    };
  }

  /**
   * Agrega estados dos nós
   */
  private aggregateState(packet: InformationPacket): void {
    try {
      const stateData = JSON.parse(packet.data);
      
      // Log agregado
      console.log(`[NucleoRaizAlma] Estado de ${stateData.nodeId}: ` +
        `carga=${(stateData.loadRatio * 100).toFixed(1)}%, ` +
        `temp=${(stateData.temperature * 100).toFixed(1)}%`);
      
      // Emitir evento de memória
      EventBus.emit('memory:stored', {
        id: `state-${stateData.nodeId}-${Date.now()}`,
        type: 'node-state',
      });
    } catch (error) {
      console.warn('[NucleoRaizAlma] Erro ao agregar estado:', error);
    }
  }

  /**
   * Solicita decisão (API pública)
   */
  requestDecision(
    action: string, 
    context: string = 'general', 
    priority: number = 0.5,
    metadata: Record<string, unknown> = {}
  ): Promise<DecisionResult> {
    return new Promise((resolve) => {
      const requestPacket = createInformationPacket(
        JSON.stringify({ action, context, priority, ...metadata }),
        priority * 10,
        priority,
        'DecisionRequest',
        'external-request',
        this.id,
        { requestId: `req_${Date.now()}` }
      );

      // Processar imediatamente se possível
      if (this._active) {
        const result = this.nodeSpecificProcessing(requestPacket);
        if (result) {
          try {
            resolve(JSON.parse(result.data));
          } catch {
            resolve({
              action: 'error',
              parameters: { error: 'Invalid response' },
              confidence: 0,
            });
          }
        }
      } else {
        // Fallback se inativo
        resolve({
          action: 'pending',
          parameters: { reason: 'Node inactive' },
          confidence: 0.5,
        });
      }
    });
  }

  /**
   * Retorna métricas específicas do núcleo
   */
  getCoreMetrics(): {
    decisionsProcessed: number;
    avgDecisionTime: number;
    decisionQueueSize: number;
  } & ReturnType<ProcessingNode['getMetrics']> {
    return {
      ...super.getMetrics(),
      decisionsProcessed: this.decisionsProcessed,
      avgDecisionTime: this.avgDecisionTime,
      decisionQueueSize: this.decisionQueue.length,
    };
  }
}
