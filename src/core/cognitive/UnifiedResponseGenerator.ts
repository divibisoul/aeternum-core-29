/**
 * UNIFIED RESPONSE GENERATOR
 * 
 * Sintetiza as saídas dos 3 módulos (Alpha, Beta, Gamma) em uma resposta coesa.
 * Incorpora explicitamente mitigações éticas e sugestões de enriquecimento.
 */

import type { 
  HemisphereOutput, 
  GammaContextualOutput, 
  IntentProfile, 
  MultiHemisphereResult 
} from './types';

// Templates de unificação por perfil
const UNIFICATION_TEMPLATES = {
  analytical: `Você é o UNIFICADOR do sistema multi-hemisférico AETERNUM.

ENTRADAS RECEBIDAS:
1. ANÁLISE ALFA (Lógica): {alpha_content}
   Confiança: {alpha_confidence} | Tags: {alpha_tags}

2. CRIATIVIDADE BETA (Intuição): {beta_content}
   Confiança: {beta_confidence} | Tags: {beta_tags}

3. CONTEXTO GAMA (Ética/Prática):
   Flags éticos: {ethical_flags}
   Viabilidade: {feasibility}
   Sugestões: {enrichment}

TAREFA:
Sintetize uma resposta FINAL que:
1. PRIORIZE a análise técnica de Alfa (perfil analítico detectado)
2. ENRIQUEÇA com insights criativos de Beta onde apropriado
3. INTEGRE as mitigações éticas do Gama
4. Mantenha formato ESTRUTURADO e objetivo

FORMATO: Estruturado com bullets/números, conclusão clara.`,

  creative: `Você é o UNIFICADOR do sistema multi-hemisférico AETERNUM.

ENTRADAS RECEBIDAS:
1. ANÁLISE ALFA (Lógica): {alpha_content}
   Confiança: {alpha_confidence}

2. CRIATIVIDADE BETA (Intuição): {beta_content}
   Confiança: {beta_confidence} | Padrões: {beta_tags}

3. CONTEXTO GAMA:
   Sugestões de enriquecimento: {enrichment}
   Restrições práticas: {constraints}

TAREFA:
Sintetize uma resposta FINAL que:
1. DESTAQUE as perspectivas criativas de Beta (perfil criativo detectado)
2. FUNDAMENTE com análise de Alfa
3. Mantenha VIABILIDADE conforme Gama
4. Use tom INSPIRADOR mas pragmático

FORMATO: Narrativo com exemplos vívidos, conclusão motivadora.`,

  practical: `Você é o UNIFICADOR do sistema multi-hemisférico AETERNUM.

ENTRADAS RECEBIDAS:
1. ANÁLISE ALFA: {alpha_content}
2. CRIATIVIDADE BETA: {beta_content}
3. AVALIAÇÃO GAMA:
   Viabilidade técnica: {feasibility}
   Recursos necessários: {resources}
   Timeline: {timeline}
   Flags éticos: {ethical_flags}

TAREFA:
Sintetize uma resposta FINAL que:
1. FOQUE em AÇÃO e implementação (perfil prático detectado)
2. Forneça PASSOS CLAROS
3. Considere RESTRIÇÕES práticas do Gama
4. Seja DIRETO e acionável

FORMATO: Passos numerados, checklists, resultado concreto.`,

  hybrid: `Você é o UNIFICADOR do sistema multi-hemisférico AETERNUM.

ENTRADAS RECEBIDAS:
1. ANÁLISE ALFA (Lógica): {alpha_content}
   Confiança: {alpha_confidence}

2. CRIATIVIDADE BETA (Intuição): {beta_content}
   Confiança: {beta_confidence}

3. CONTEXTO GAMA:
   {ethical_flags}
   {feasibility}
   {enrichment}

TAREFA:
Sintetize uma resposta FINAL que:
1. EQUILIBRE análise e criatividade (perfil híbrido)
2. INCORPORE sugestões de enriquecimento do Gama
3. IMPLEMENTE mitigações éticas quando necessário
4. Mantenha QUALIDADE e utilidade

FORMATO: Balanceado - seções claras alternando insights e ações.`,
};

/**
 * UnifiedResponseGenerator - Gerador de Resposta Unificada
 */
class UnifiedResponseGeneratorService {
  /**
   * Gera o prompt de unificação para a IA
   */
  generateUnificationPrompt(
    alpha: HemisphereOutput,
    beta: HemisphereOutput,
    gamma: GammaContextualOutput,
    intent: IntentProfile
  ): string {
    // Selecionar template baseado no perfil
    const template = UNIFICATION_TEMPLATES[intent.primary] || UNIFICATION_TEMPLATES.hybrid;
    
    // Formatar flags éticos
    const ethicalFlagsStr = gamma.ethicalFlags.length > 0
      ? gamma.ethicalFlags.map(f => 
          `• [${f.severity}] ${f.type}: ${f.description}\n  → Mitigação: ${f.suggestedMitigation}`
        ).join('\n')
      : 'Nenhum concern ético identificado.';
    
    // Formatar viabilidade
    const feasibilityStr = `
Viabilidade Técnica: ${gamma.feasibilityAssessment.technicalFeasibility}
Complexidade: ${(gamma.feasibilityAssessment.complexityScore * 100).toFixed(0)}%
Timeline: ${gamma.feasibilityAssessment.timelineEstimate || 'Não estimado'}
Recursos: ${gamma.feasibilityAssessment.requiredResources.join(', ') || 'Mínimos'}`;
    
    // Formatar sugestões
    const enrichmentStr = gamma.enrichmentSuggestions.length > 0
      ? gamma.enrichmentSuggestions.map(s => `• ${s}`).join('\n')
      : 'Sem sugestões adicionais.';
    
    // Formatar restrições
    const constraintsStr = gamma.practicalConstraints.length > 0
      ? gamma.practicalConstraints.join(', ')
      : 'Sem restrições identificadas';
    
    // Substituir placeholders
    return template
      .replace('{alpha_content}', this.truncateContent(alpha.content, 2000))
      .replace('{alpha_confidence}', `${(alpha.confidence * 100).toFixed(0)}%`)
      .replace('{alpha_tags}', alpha.metadata.logicTags.join(', ') || 'N/A')
      .replace('{beta_content}', this.truncateContent(beta.content, 2000))
      .replace('{beta_confidence}', `${(beta.confidence * 100).toFixed(0)}%`)
      .replace('{beta_tags}', alpha.metadata.creativityTags?.join(', ') || beta.metadata.patterns?.join(', ') || 'N/A')
      .replace('{ethical_flags}', ethicalFlagsStr)
      .replace('{feasibility}', feasibilityStr)
      .replace('{enrichment}', enrichmentStr)
      .replace('{constraints}', constraintsStr)
      .replace('{resources}', gamma.feasibilityAssessment.requiredResources.join(', ') || 'Mínimos')
      .replace('{timeline}', gamma.feasibilityAssessment.timelineEstimate || 'A definir');
  }
  
  /**
   * Gera resposta de fallback quando unificação falha
   */
  generateFallbackResponse(
    alpha: HemisphereOutput,
    beta: HemisphereOutput,
    gamma: GammaContextualOutput,
    intent: IntentProfile
  ): string {
    // Combinar baseado no peso
    const sections: string[] = [];
    
    // Seção principal baseada no perfil dominante
    if (intent.weights.analytical >= intent.weights.creative) {
      sections.push('## Análise\n' + this.truncateContent(alpha.content, 1500));
      if (intent.weights.creative > 0.3) {
        sections.push('\n## Perspectiva Criativa\n' + this.truncateContent(beta.content, 800));
      }
    } else {
      sections.push('## Visão\n' + this.truncateContent(beta.content, 1500));
      sections.push('\n## Fundamentação\n' + this.truncateContent(alpha.content, 800));
    }
    
    // Adicionar considerações éticas se houver
    if (gamma.ethicalFlags.length > 0) {
      sections.push('\n## Considerações Importantes');
      for (const flag of gamma.ethicalFlags.slice(0, 3)) {
        sections.push(`\n**${flag.type}** (${flag.severity}): ${flag.description}`);
        sections.push(`→ ${flag.suggestedMitigation}`);
      }
    }
    
    // Adicionar recomendações práticas
    if (gamma.enrichmentSuggestions.length > 0) {
      sections.push('\n## Recomendações');
      for (const suggestion of gamma.enrichmentSuggestions.slice(0, 3)) {
        sections.push(`• ${suggestion}`);
      }
    }
    
    return sections.join('\n');
  }
  
  /**
   * Avalia qualidade da resposta unificada
   */
  evaluateQuality(
    unifiedResponse: string,
    alpha: HemisphereOutput,
    beta: HemisphereOutput,
    gamma: GammaContextualOutput
  ): number {
    let quality = 0.5;
    
    // Verificar incorporação de conteúdo de Alpha
    if (this.hasOverlap(unifiedResponse, alpha.content, 0.2)) {
      quality += 0.15;
    }
    
    // Verificar incorporação de conteúdo de Beta
    if (this.hasOverlap(unifiedResponse, beta.content, 0.1)) {
      quality += 0.1;
    }
    
    // Verificar tratamento de flags éticos
    if (gamma.ethicalFlags.length > 0) {
      const mentionedFlags = gamma.ethicalFlags.filter(f => 
        unifiedResponse.toLowerCase().includes(f.type.toLowerCase()) ||
        unifiedResponse.includes(f.suggestedMitigation.slice(0, 30))
      );
      quality += (mentionedFlags.length / gamma.ethicalFlags.length) * 0.1;
    } else {
      quality += 0.1;
    }
    
    // Boost por estrutura
    if (/\d+\.|#{1,3}\s|•|\*/g.test(unifiedResponse)) {
      quality += 0.1;
    }
    
    // Boost por tamanho adequado
    if (unifiedResponse.length >= 300 && unifiedResponse.length <= 4000) {
      quality += 0.05;
    }
    
    return Math.min(1, quality);
  }
  
  /**
   * Determina hemisfério dominante
   */
  determineDominantHemisphere(
    alpha: HemisphereOutput,
    beta: HemisphereOutput,
    intent: IntentProfile
  ): 'alpha' | 'beta' | 'balanced' {
    const alphaDominance = alpha.confidence * intent.weights.analytical;
    const betaDominance = beta.confidence * intent.weights.creative;
    
    const diff = Math.abs(alphaDominance - betaDominance);
    
    if (diff < 0.15) return 'balanced';
    return alphaDominance > betaDominance ? 'alpha' : 'beta';
  }
  
  /**
   * Trunca conteúdo para caber no prompt
   */
  private truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    
    // Tentar truncar em um ponto natural
    const truncated = content.slice(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    
    const cutPoint = Math.max(lastPeriod, lastNewline);
    
    if (cutPoint > maxLength * 0.7) {
      return content.slice(0, cutPoint + 1) + '\n[...]';
    }
    
    return truncated + '...';
  }
  
  /**
   * Verifica overlap entre textos
   */
  private hasOverlap(unified: string, source: string, threshold: number): boolean {
    // Extrair palavras significativas (>4 chars)
    const sourceWords = new Set(
      source.toLowerCase().match(/\b\w{5,}\b/g) || []
    );
    const unifiedWords = unified.toLowerCase().match(/\b\w{5,}\b/g) || [];
    
    if (sourceWords.size === 0) return true;
    
    let matches = 0;
    for (const word of unifiedWords) {
      if (sourceWords.has(word)) matches++;
    }
    
    return (matches / sourceWords.size) >= threshold;
  }
  
  /**
   * Gera metadados do resultado
   */
  generateMetadata(
    startTime: number,
    stages: Array<{ name: string; durationMs: number; success: boolean }>,
    dominant: 'alpha' | 'beta' | 'balanced',
    qualityScore: number
  ): MultiHemisphereResult['metadata'] {
    return {
      totalProcessingTimeMs: Date.now() - startTime,
      pipelineStages: stages,
      dominantHemisphere: dominant,
      qualityScore,
    };
  }
}

// Singleton
export const UnifiedResponseGenerator = new UnifiedResponseGeneratorService();
export default UnifiedResponseGenerator;
