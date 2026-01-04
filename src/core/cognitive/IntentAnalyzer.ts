/**
 * INTENT ANALYZER
 * 
 * Analisa a intenção do usuário e gera perfil de pesos para os hemisférios.
 * Determina o tipo primário de processamento necessário.
 */

import type { IntentProfile } from './types';

// Padrões de detecção por categoria
const PATTERNS = {
  analytical: [
    /analis(ar|e|is)/i,
    /calcul(ar|e|ate)/i,
    /resolver?/i,
    /debug(ar|gar)?/i,
    /otimiz(ar|e)/i,
    /compar(ar|e)/i,
    /estatístic/i,
    /algoritmo/i,
    /lógic[oa]/i,
    /estrutur/i,
    /dados/i,
    /sql|database|banco de dados/i,
    /performance|desempenho/i,
    /avaliar?/i,
    /verificar?/i,
    /\d+[\+\-\*\/\^]\d+/,
  ],
  creative: [
    /cri(ar|e|ate)\s+(uma?\s+)?(história|story|ideia|idea)/i,
    /imagin(ar|e)/i,
    /invent(ar|e)/i,
    /design(ar)?/i,
    /brainstorm/i,
    /inovar?/i,
    /criativ/i,
    /original/i,
    /poema|poem/i,
    /narrativa|narrative/i,
    /metáfora|metaphor/i,
    /visão|vision/i,
    /futuro|future/i,
    /possibilidade/i,
  ],
  practical: [
    /implement(ar|e)/i,
    /construir|build/i,
    /fazer|make|do/i,
    /prático|practical/i,
    /funcional/i,
    /aplicar?/i,
    /executar?/i,
    /passo a passo|step by step/i,
    /tutorial/i,
    /como (fazer|criar|implement)/i,
    /how to/i,
    /viabilidade|feasibility/i,
    /recurso|resource/i,
    /prazo|deadline|timeline/i,
  ],
  ethical: [
    /ética|ethical|ethics/i,
    /moral/i,
    /privacidade|privacy/i,
    /segurança|security|safety/i,
    /bias|viés/i,
    /dados pessoais|personal data/i,
    /consentimento|consent/i,
    /transparência|transparency/i,
    /responsabilidade|accountability/i,
    /impacto social|social impact/i,
  ],
  code: [
    /código|code/i,
    /função|function/i,
    /classe|class/i,
    /componente|component/i,
    /script/i,
    /programar?|program/i,
    /\b(javascript|typescript|python|react|node|html|css|sql)\b/i,
    /api|rest|graphql/i,
    /\b(hook|useState|useEffect)\b/i,
  ],
  calculation: [
    /calcul/i,
    /equação|equation/i,
    /matemática|math/i,
    /fórmula|formula/i,
    /derivada|derivative/i,
    /integral/i,
    /estatística|statistics/i,
    /probabilidade|probability/i,
    /porcentagem|percentage/i,
    /\d+\s*[\+\-\*\/\^\%]\s*\d+/,
  ],
};

// Indicadores de complexidade
const COMPLEXITY_INDICATORS = {
  extreme: [
    /sistema (completo|complexo|distribuído)/i,
    /arquitetura/i,
    /microservic/i,
    /machine learning|deep learning|neural network/i,
    /blockchain/i,
    /quantum/i,
    /multi(thread|process)/i,
  ],
  high: [
    /múltipl[oa]s/i,
    /integra(ção|tion)/i,
    /completo|complete/i,
    /avançado|advanced/i,
    /otimiza(ção|tion)/i,
    /escala|scale/i,
  ],
  medium: [
    /component/i,
    /função|function/i,
    /módulo|module/i,
    /api/i,
  ],
};

// Indicadores de urgência
const URGENCY_INDICATORS = {
  high: [
    /urgent(e|ly)?/i,
    /rápido|quick|fast/i,
    /agora|now/i,
    /imediato|immediate/i,
    /crítico|critical/i,
    /emergência|emergency/i,
  ],
  medium: [
    /logo|soon/i,
    /importante|important/i,
    /prioridade|priority/i,
  ],
};

/**
 * IntentAnalyzer - Serviço de Análise de Intenção
 */
class IntentAnalyzerService {
  /**
   * Analisa a query do usuário e retorna o perfil de intenção
   */
  analyze(query: string): IntentProfile {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Calcular pesos brutos
    const rawWeights = {
      analytical: this.calculatePatternScore(normalizedQuery, PATTERNS.analytical),
      creative: this.calculatePatternScore(normalizedQuery, PATTERNS.creative),
      practical: this.calculatePatternScore(normalizedQuery, PATTERNS.practical),
    };
    
    // Normalizar pesos
    const total = rawWeights.analytical + rawWeights.creative + rawWeights.practical;
    const weights = total > 0 ? {
      analytical: rawWeights.analytical / total,
      creative: rawWeights.creative / total,
      practical: rawWeights.practical / total,
    } : {
      analytical: 0.33,
      creative: 0.33,
      practical: 0.34,
    };
    
    // Determinar intenção primária
    const primary = this.determinePrimary(weights);
    
    // Detectar metadados
    const metadata = {
      complexity: this.detectComplexity(normalizedQuery),
      domain: this.detectDomain(normalizedQuery),
      urgency: this.detectUrgency(normalizedQuery),
      requiresCode: this.matchesPatterns(normalizedQuery, PATTERNS.code),
      requiresCalculation: this.matchesPatterns(normalizedQuery, PATTERNS.calculation),
      requiresCreativity: weights.creative > 0.4,
      ethicalConcerns: this.matchesPatterns(normalizedQuery, PATTERNS.ethical),
    };
    
    return {
      primary,
      weights,
      metadata,
    };
  }
  
  /**
   * Calcula score de padrões
   */
  private calculatePatternScore(query: string, patterns: RegExp[]): number {
    let score = 0;
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        score += 1;
      }
    }
    return score;
  }
  
  /**
   * Verifica se query corresponde a padrões
   */
  private matchesPatterns(query: string, patterns: RegExp[]): boolean {
    return patterns.some(p => p.test(query));
  }
  
  /**
   * Determina a intenção primária
   */
  private determinePrimary(weights: IntentProfile['weights']): IntentProfile['primary'] {
    const { analytical, creative, practical } = weights;
    
    // Se pesos equilibrados
    if (Math.abs(analytical - creative) < 0.15 && Math.abs(creative - practical) < 0.15) {
      return 'hybrid';
    }
    
    const max = Math.max(analytical, creative, practical);
    
    if (max === analytical) return 'analytical';
    if (max === creative) return 'creative';
    return 'practical';
  }
  
  /**
   * Detecta complexidade da tarefa
   */
  private detectComplexity(query: string): IntentProfile['metadata']['complexity'] {
    if (this.matchesPatterns(query, COMPLEXITY_INDICATORS.extreme)) {
      return 'extreme';
    }
    if (this.matchesPatterns(query, COMPLEXITY_INDICATORS.high)) {
      return 'high';
    }
    if (this.matchesPatterns(query, COMPLEXITY_INDICATORS.medium)) {
      return 'medium';
    }
    
    // Baseado no tamanho também
    const wordCount = query.split(/\s+/).length;
    if (wordCount > 100) return 'high';
    if (wordCount > 50) return 'medium';
    
    return 'low';
  }
  
  /**
   * Detecta domínio da query
   */
  private detectDomain(query: string): string {
    const domains: Record<string, RegExp[]> = {
      'software': [/código|code|software|app|aplicativo|sistema|program/i],
      'data': [/dados|data|análise|analysis|sql|database/i],
      'design': [/design|ui|ux|interface|layout/i],
      'business': [/negócio|business|empresa|company|mercado|market/i],
      'science': [/ciência|science|research|pesquisa/i],
      'creative': [/arte|art|criativ|creative|escrit|writ/i],
    };
    
    for (const [domain, patterns] of Object.entries(domains)) {
      if (this.matchesPatterns(query, patterns)) {
        return domain;
      }
    }
    
    return 'general';
  }
  
  /**
   * Detecta urgência
   */
  private detectUrgency(query: string): 'low' | 'medium' | 'high' {
    if (this.matchesPatterns(query, URGENCY_INDICATORS.high)) {
      return 'high';
    }
    if (this.matchesPatterns(query, URGENCY_INDICATORS.medium)) {
      return 'medium';
    }
    return 'low';
  }
}

// Singleton
export const IntentAnalyzer = new IntentAnalyzerService();
export default IntentAnalyzer;
