/**
 * TIPOS COMUNS PARA ARQUITETURA MULTI-HEMISFÉRICA
 * 
 * Define interfaces compartilhadas entre os módulos cognitivos.
 */

// Perfil de intenção analisado
export interface IntentProfile {
  primary: 'analytical' | 'creative' | 'practical' | 'hybrid';
  weights: {
    analytical: number;
    creative: number;
    practical: number;
  };
  embedding?: number[];
  metadata: {
    complexity: 'low' | 'medium' | 'high' | 'extreme';
    domain: string;
    urgency: 'low' | 'medium' | 'high';
    requiresCode: boolean;
    requiresCalculation: boolean;
    requiresCreativity: boolean;
    ethicalConcerns: boolean;
  };
}

// Saída padrão de um hemisfério
export interface HemisphereOutput {
  content: string;
  confidence: number;
  processingTimeMs: number;
  metadata: {
    logicTags: string[];
    creativityTags: string[];
    citations?: Array<{ source: string; relevance: number }>;
    assumptions?: string[];
    patterns?: string[];
  };
}

// Saída do módulo Gama (contextualização ético-prática)
export interface GammaContextualOutput {
  ethicalFlags: Array<{
    id: string;
    type: 'PRIVACY' | 'BIAS' | 'SAFETY' | 'AUTONOMY' | 'TRANSPARENCY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    suggestedMitigation: string;
  }>;
  feasibilityAssessment: {
    technicalFeasibility: 'LOW' | 'MEDIUM' | 'HIGH';
    requiredResources: string[];
    timelineEstimate?: string;
    complexityScore: number;
  };
  enrichmentSuggestions: string[];
  practicalConstraints: string[];
}

// Resultado do pipeline completo
export interface MultiHemisphereResult {
  alphaOutput: HemisphereOutput;
  betaOutput: HemisphereOutput;
  gammaContext: GammaContextualOutput;
  unifiedResponse: string;
  intent: IntentProfile;
  metadata: {
    totalProcessingTimeMs: number;
    pipelineStages: Array<{
      name: string;
      durationMs: number;
      success: boolean;
    }>;
    dominantHemisphere: 'alpha' | 'beta' | 'balanced';
    qualityScore: number;
  };
}

// Regra ética para o módulo Gama
export interface EthicalRule {
  id: string;
  type: 'PRIVACY' | 'BIAS' | 'SAFETY' | 'AUTONOMY' | 'TRANSPARENCY';
  triggerPatterns: RegExp[];
  severityCriteria: {
    HIGH: string;
    MEDIUM: string;
    LOW: string;
  };
  suggestedMitigation: string;
}

// Evento de processamento multi-hemisférico
export interface MultiHemisphereEvent {
  taskId: string;
  stage: 'intent' | 'alpha' | 'beta' | 'gamma' | 'unification' | 'complete';
  status: 'start' | 'processing' | 'complete' | 'error';
  data?: unknown;
  timestamp: number;
}
