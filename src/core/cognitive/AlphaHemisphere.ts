/**
 * ALPHA HEMISPHERE (ANALÍTICO/LÓGICO)
 * 
 * Responsável pelo processamento analítico, lógico e estruturado.
 * Foca em:
 * - Raciocínio passo a passo
 * - Código e algoritmos
 * - Cálculos e análise de dados
 * - Verificação factual
 */

import type { HemisphereOutput, IntentProfile } from './types';

// Templates de prompt para Alpha
const ALPHA_PROMPTS = {
  default: `Você é o hemisfério ALFA (analítico/lógico). Sua tarefa:
1. Analisar o problema de forma ESTRUTURADA
2. Fornecer raciocínio PASSO A PASSO
3. Incluir dados, citações ou referências quando aplicável
4. Identificar premissas e limitações
5. Ser PRECISO e OBJETIVO

PROIBIDO: Divagações, auto-descrição, explicações desnecessárias.
FOCO: Solução lógica e fundamentada.`,

  code: `Você é um engenheiro de software sênior. Sua tarefa:
1. Escrever código LIMPO, FUNCIONAL e TESTÁVEL
2. Incluir tratamento de erros adequado
3. Seguir melhores práticas da linguagem
4. Código COMPLETO - sem placeholders
5. Comentários mínimos (código fala por si)

PROIBIDO: Código incompleto, placeholders, explicações extensas.
FOCO: Código que FUNCIONA.`,

  calculation: `Você é um matemático/cientista de dados. Sua tarefa:
1. Resolver com PRECISÃO absoluta
2. Mostrar PASSOS de forma clara
3. Usar notação matemática apropriada
4. Verificar a resposta
5. Identificar pressupostos

PROIBIDO: Erros de cálculo, passos pulados.
FOCO: Resultado CORRETO e verificável.`,

  analysis: `Você é um analista sênior. Sua tarefa:
1. Examinar dados com RIGOR metodológico
2. Identificar padrões e anomalias
3. Apresentar insights ACIONÁVEIS
4. Usar evidências para conclusões
5. Ser objetivo e baseado em dados

PROIBIDO: Afirmações sem suporte, viés.
FOCO: Análise fundamentada e útil.`,
};

// Tags lógicas detectáveis
const LOGIC_TAGS = [
  'algorithm', 'step_by_step', 'data_backed', 'verified',
  'structured', 'logical', 'analytical', 'precise',
  'factual', 'evidence_based', 'systematic', 'objective',
];

/**
 * AlphaHemisphere - Processador Analítico/Lógico
 */
class AlphaHemisphereService {
  /**
   * Processa a query através da lente analítica
   */
  process(
    query: string,
    intent: IntentProfile
  ): { systemPrompt: string; temperature: number; expectedTags: string[] } {
    const startTime = Date.now();
    
    // Selecionar prompt baseado no contexto
    const systemPrompt = this.selectPrompt(intent);
    
    // Determinar temperatura (baixa para precisão)
    const temperature = this.selectTemperature(intent);
    
    // Tags esperadas baseadas na análise
    const expectedTags = this.predictLogicTags(intent);
    
    console.log('[AlphaHemisphere] Processing with config:', {
      promptType: intent.metadata.requiresCode ? 'code' : 
                  intent.metadata.requiresCalculation ? 'calculation' : 'default',
      temperature,
      expectedTags,
    });
    
    return {
      systemPrompt,
      temperature,
      expectedTags,
    };
  }
  
  /**
   * Analisa a resposta e extrai metadados
   */
  analyzeResponse(
    response: string,
    startTime: number
  ): Omit<HemisphereOutput, 'content'> {
    const processingTimeMs = Date.now() - startTime;
    
    // Extrair tags lógicas da resposta
    const logicTags = this.extractLogicTags(response);
    
    // Calcular confiança baseada na estrutura
    const confidence = this.calculateConfidence(response, logicTags);
    
    // Extrair citações se houver
    const citations = this.extractCitations(response);
    
    // Extrair premissas
    const assumptions = this.extractAssumptions(response);
    
    return {
      confidence,
      processingTimeMs,
      metadata: {
        logicTags,
        creativityTags: [], // Alpha não tem tags criativas
        citations,
        assumptions,
      },
    };
  }
  
  /**
   * Seleciona o prompt apropriado
   */
  private selectPrompt(intent: IntentProfile): string {
    if (intent.metadata.requiresCode) {
      return ALPHA_PROMPTS.code;
    }
    if (intent.metadata.requiresCalculation) {
      return ALPHA_PROMPTS.calculation;
    }
    if (intent.primary === 'analytical' || intent.weights.analytical > 0.5) {
      return ALPHA_PROMPTS.analysis;
    }
    return ALPHA_PROMPTS.default;
  }
  
  /**
   * Seleciona temperatura (baixa para precisão)
   */
  private selectTemperature(intent: IntentProfile): number {
    if (intent.metadata.requiresCalculation) return 0.1;
    if (intent.metadata.requiresCode) return 0.3;
    if (intent.metadata.complexity === 'extreme') return 0.3;
    return 0.5;
  }
  
  /**
   * Prevê tags lógicas esperadas
   */
  private predictLogicTags(intent: IntentProfile): string[] {
    const tags: string[] = ['analytical', 'structured'];
    
    if (intent.metadata.requiresCode) {
      tags.push('algorithm', 'systematic');
    }
    if (intent.metadata.requiresCalculation) {
      tags.push('precise', 'verified', 'step_by_step');
    }
    if (intent.primary === 'analytical') {
      tags.push('data_backed', 'evidence_based');
    }
    
    return tags;
  }
  
  /**
   * Extrai tags lógicas da resposta
   */
  private extractLogicTags(response: string): string[] {
    const tags: string[] = [];
    const lower = response.toLowerCase();
    
    // Detectar padrões de estrutura lógica
    if (/\d+\.\s|passo|step|primeiro|segundo|terceiro/i.test(lower)) {
      tags.push('step_by_step');
    }
    if (/```[\w]*\n/.test(response)) {
      tags.push('algorithm');
    }
    if (/de acordo com|segundo|conforme|research shows/i.test(lower)) {
      tags.push('data_backed');
    }
    if (/verificad|confirmed|tested|testado/i.test(lower)) {
      tags.push('verified');
    }
    if (/portanto|therefore|conclusão|conclusion|assim|hence/i.test(lower)) {
      tags.push('logical');
    }
    if (/análise|analysis|avaliar|evaluate/i.test(lower)) {
      tags.push('analytical');
    }
    
    return [...new Set(tags)];
  }
  
  /**
   * Calcula confiança da resposta
   */
  private calculateConfidence(response: string, logicTags: string[]): number {
    let confidence = 0.5; // Base
    
    // Boost por tags lógicas
    confidence += logicTags.length * 0.05;
    
    // Boost por estrutura
    if (response.includes('```')) confidence += 0.1;
    if (/\d+\.\s/.test(response)) confidence += 0.1;
    
    // Boost por tamanho adequado
    if (response.length > 200 && response.length < 5000) confidence += 0.1;
    
    // Penalidade por sinais de incerteza
    if (/talvez|maybe|não tenho certeza|i'm not sure/i.test(response)) {
      confidence -= 0.15;
    }
    
    return Math.max(0.1, Math.min(1, confidence));
  }
  
  /**
   * Extrai citações da resposta
   */
  private extractCitations(response: string): Array<{ source: string; relevance: number }> {
    const citations: Array<{ source: string; relevance: number }> = [];
    
    // Padrão: [fonte] ou (fonte, ano) ou "segundo X"
    const patterns = [
      /\[([^\]]+)\]/g,
      /segundo\s+([^,.\n]+)/gi,
      /de acordo com\s+([^,.\n]+)/gi,
      /according to\s+([^,.\n]+)/gi,
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        citations.push({
          source: match[1].trim(),
          relevance: 0.7,
        });
      }
    }
    
    return citations.slice(0, 5);
  }
  
  /**
   * Extrai premissas/suposições
   */
  private extractAssumptions(response: string): string[] {
    const assumptions: string[] = [];
    
    const patterns = [
      /assumindo que\s+([^,.\n]+)/gi,
      /assuming\s+([^,.\n]+)/gi,
      /considerando que\s+([^,.\n]+)/gi,
      /given that\s+([^,.\n]+)/gi,
      /pressupondo\s+([^,.\n]+)/gi,
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        assumptions.push(match[1].trim());
      }
    }
    
    return assumptions.slice(0, 3);
  }
}

// Singleton
export const AlphaHemisphere = new AlphaHemisphereService();
export default AlphaHemisphere;
