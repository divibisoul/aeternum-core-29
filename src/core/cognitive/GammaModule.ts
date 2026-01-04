/**
 * GAMMA MODULE (CONTEXTUALIZAÇÃO ÉTICO-PRÁTICA)
 * 
 * Responsável pela validação ética e avaliação de viabilidade prática.
 * Atua como consultor CONTÍNUO, não bloqueador.
 * 
 * Foca em:
 * - Identificação de concerns éticos
 * - Avaliação de viabilidade
 * - Sugestões de enriquecimento
 * - Mitigação de riscos
 */

import type { GammaContextualOutput, HemisphereOutput, EthicalRule } from './types';

// Regras éticas v1 (10-15 regras verificáveis)
const ETHICAL_RULES: EthicalRule[] = [
  {
    id: 'PRIVACY_001',
    type: 'PRIVACY',
    triggerPatterns: [
      /coletar dados|collect data/i,
      /armazenar informação pessoal|store personal/i,
      /registrar comportamento|track behavior/i,
      /monitorar usuário|monitor user/i,
      /dados sensíveis|sensitive data/i,
    ],
    severityCriteria: {
      HIGH: 'dados sensíveis (saúde, financeiro, localização)',
      MEDIUM: 'dados identificáveis (email, nome)',
      LOW: 'dados anonimizados ou agregados',
    },
    suggestedMitigation: 'Implementar: 1) Consentimento explícito, 2) Anonimização, 3) Tempo de retenção definido, 4) Direito ao esquecimento.',
  },
  {
    id: 'BIAS_001',
    type: 'BIAS',
    triggerPatterns: [
      /recomendar para grupo|recommend for group/i,
      /selecionar candidatos|select candidates/i,
      /avaliar mérito|evaluate merit/i,
      /classificar pessoas|classify people/i,
      /machine learning|ml|modelo preditivo/i,
    ],
    severityCriteria: {
      HIGH: 'decisões que afetam oportunidades (emprego, crédito, educação)',
      MEDIUM: 'recomendações que podem reforçar estereótipos',
      LOW: 'generalizações não prejudiciais',
    },
    suggestedMitigation: 'Adicionar: 1) Aviso sobre viés potencial, 2) Recomendação de revisão humana, 3) Uso de dados balanceados.',
  },
  {
    id: 'SAFETY_001',
    type: 'SAFETY',
    triggerPatterns: [
      /automação crítica|critical automation/i,
      /controle de (acesso|sistema)|access control/i,
      /decisão automática|automated decision/i,
      /sem supervisão|without supervision/i,
      /operação autônoma|autonomous operation/i,
    ],
    severityCriteria: {
      HIGH: 'sistemas que podem causar dano físico ou financeiro',
      MEDIUM: 'sistemas que afetam operações importantes',
      LOW: 'sistemas com impacto limitado',
    },
    suggestedMitigation: 'Incluir: 1) Supervisão humana obrigatória, 2) Fallbacks de segurança, 3) Logs de auditoria.',
  },
  {
    id: 'AUTONOMY_001',
    type: 'AUTONOMY',
    triggerPatterns: [
      /substituir humano|replace human/i,
      /tomada de decisão automática|automated decision making/i,
      /remover intervenção|remove intervention/i,
      /sem aprovação|without approval/i,
    ],
    severityCriteria: {
      HIGH: 'remoção completa de controle humano em decisões importantes',
      MEDIUM: 'redução significativa de participação humana',
      LOW: 'automação de tarefas repetitivas mantendo supervisão',
    },
    suggestedMitigation: 'Garantir: 1) Mecanismo de override humano, 2) Explicabilidade das decisões, 3) Opção de opt-out.',
  },
  {
    id: 'TRANSPARENCY_001',
    type: 'TRANSPARENCY',
    triggerPatterns: [
      /ocultar|hide|esconder/i,
      /black box|caixa preta/i,
      /sem explicação|without explanation/i,
      /algoritmo secreto|secret algorithm/i,
    ],
    severityCriteria: {
      HIGH: 'decisões opacas que afetam direitos',
      MEDIUM: 'processos não documentados',
      LOW: 'detalhes técnicos não essenciais',
    },
    suggestedMitigation: 'Implementar: 1) Documentação clara do processo, 2) Explicações acessíveis, 3) Canais de questionamento.',
  },
  {
    id: 'PRIVACY_002',
    type: 'PRIVACY',
    triggerPatterns: [
      /compartilhar com terceiros|share with third/i,
      /vender dados|sell data/i,
      /transferir informações|transfer information/i,
    ],
    severityCriteria: {
      HIGH: 'compartilhamento sem consentimento explícito',
      MEDIUM: 'compartilhamento com parceiros comerciais',
      LOW: 'compartilhamento para fins legais ou de segurança',
    },
    suggestedMitigation: 'Exigir: 1) Consentimento explícito para cada compartilhamento, 2) Lista clara de destinatários, 3) Opção de revogação.',
  },
  {
    id: 'BIAS_002',
    type: 'BIAS',
    triggerPatterns: [
      /score de crédito|credit score/i,
      /avaliação de risco|risk assessment/i,
      /perfil de comportamento|behavior profile/i,
    ],
    severityCriteria: {
      HIGH: 'scoring que afeta acesso a serviços essenciais',
      MEDIUM: 'scoring para personalização',
      LOW: 'métricas internas de sistema',
    },
    suggestedMitigation: 'Incluir: 1) Explicação do critério de scoring, 2) Mecanismo de contestação, 3) Revisão periódica de viés.',
  },
  {
    id: 'SAFETY_002',
    type: 'SAFETY',
    triggerPatterns: [
      /credenciais|credentials/i,
      /senha|password/i,
      /token de acesso|access token/i,
      /chave api|api key/i,
    ],
    severityCriteria: {
      HIGH: 'exposição de credenciais em texto claro',
      MEDIUM: 'armazenamento de credenciais sem criptografia adequada',
      LOW: 'manipulação de credenciais com práticas seguras',
    },
    suggestedMitigation: 'Garantir: 1) Criptografia de credenciais, 2) Rotação periódica, 3) Princípio do menor privilégio.',
  },
];

// Indicadores de viabilidade
const FEASIBILITY_INDICATORS = {
  resources: {
    high: [/equipe grande|large team/i, /orçamento alto|high budget/i, /infraestrutura complexa/i],
    medium: [/alguns desenvolvedores|few developers/i, /recursos moderados/i],
    low: [/uma pessoa|single dev/i, /baixo custo|low cost/i, /simples/i],
  },
  timeline: {
    long: [/meses|months/i, /longo prazo|long term/i, /anos|years/i],
    medium: [/semanas|weeks/i, /algumas sprints/i],
    short: [/dias|days/i, /rápido|quick/i, /urgente/i],
  },
};

/**
 * GammaModule - Contextualizador Ético-Prático
 */
class GammaModuleService {
  /**
   * Contextualiza as saídas de Alpha e Beta
   */
  contextualize(
    alphaContent: string,
    betaContent: string,
    originalQuery: string
  ): GammaContextualOutput {
    const combinedContent = `${alphaContent}\n\n${betaContent}`;
    
    // 1. Análise Ética
    const ethicalFlags = this.checkEthicalRules(combinedContent, originalQuery);
    
    // 2. Avaliação de Viabilidade
    const feasibilityAssessment = this.assessFeasibility(combinedContent, originalQuery);
    
    // 3. Sugestões de Enriquecimento
    const enrichmentSuggestions = this.generateEnrichmentSuggestions(
      alphaContent,
      betaContent,
      ethicalFlags
    );
    
    // 4. Restrições Práticas
    const practicalConstraints = this.identifyPracticalConstraints(combinedContent);
    
    console.log('[GammaModule] Contextualization complete:', {
      ethicalFlagsCount: ethicalFlags.length,
      feasibility: feasibilityAssessment.technicalFeasibility,
      enrichmentCount: enrichmentSuggestions.length,
    });
    
    return {
      ethicalFlags,
      feasibilityAssessment,
      enrichmentSuggestions,
      practicalConstraints,
    };
  }
  
  /**
   * Verifica regras éticas
   */
  private checkEthicalRules(
    content: string,
    query: string
  ): GammaContextualOutput['ethicalFlags'] {
    const flags: GammaContextualOutput['ethicalFlags'] = [];
    const combinedText = `${query}\n${content}`;
    
    for (const rule of ETHICAL_RULES) {
      // Verificar se algum padrão dispara
      const triggered = rule.triggerPatterns.some(pattern => pattern.test(combinedText));
      
      if (triggered) {
        // Determinar severidade
        const severity = this.determineSeverity(combinedText, rule);
        
        flags.push({
          id: rule.id,
          type: rule.type,
          severity,
          description: this.generateFlagDescription(rule, severity),
          suggestedMitigation: rule.suggestedMitigation,
        });
      }
    }
    
    return flags;
  }
  
  /**
   * Determina severidade de uma violação
   */
  private determineSeverity(
    content: string,
    rule: EthicalRule
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    // Verificar indicadores de alta severidade
    if (this.containsHighSeverityIndicators(content, rule)) {
      return 'HIGH';
    }
    
    // Verificar indicadores de média severidade
    if (this.containsMediumSeverityIndicators(content, rule)) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }
  
  /**
   * Verifica indicadores de alta severidade
   */
  private containsHighSeverityIndicators(content: string, rule: EthicalRule): boolean {
    const highIndicators: Record<string, RegExp[]> = {
      PRIVACY: [/dados de saúde|health data/i, /financeiro|financial/i, /localização|location/i],
      BIAS: [/emprego|employment/i, /crédito|credit/i, /educação|education/i],
      SAFETY: [/dano físico|physical harm/i, /perda financeira|financial loss/i],
      AUTONOMY: [/sem supervisão|without supervision/i, /totalmente automático|fully automated/i],
      TRANSPARENCY: [/afeta direitos|affects rights/i, /decisão legal|legal decision/i],
    };
    
    const patterns = highIndicators[rule.type] || [];
    return patterns.some(p => p.test(content));
  }
  
  /**
   * Verifica indicadores de média severidade
   */
  private containsMediumSeverityIndicators(content: string, rule: EthicalRule): boolean {
    const mediumIndicators: Record<string, RegExp[]> = {
      PRIVACY: [/email|nome|name/i, /identificável|identifiable/i],
      BIAS: [/recomendação|recommendation/i, /personalização|personalization/i],
      SAFETY: [/operação importante|important operation/i],
      AUTONOMY: [/reduz participação|reduce participation/i],
      TRANSPARENCY: [/não documentado|undocumented/i],
    };
    
    const patterns = mediumIndicators[rule.type] || [];
    return patterns.some(p => p.test(content));
  }
  
  /**
   * Gera descrição para um flag
   */
  private generateFlagDescription(rule: EthicalRule, severity: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    const descriptions: Record<string, string> = {
      PRIVACY: `Concern de privacidade detectado: ${rule.severityCriteria[severity]}`,
      BIAS: `Potencial viés algorítmico: ${rule.severityCriteria[severity]}`,
      SAFETY: `Concern de segurança: ${rule.severityCriteria[severity]}`,
      AUTONOMY: `Concern de autonomia humana: ${rule.severityCriteria[severity]}`,
      TRANSPARENCY: `Concern de transparência: ${rule.severityCriteria[severity]}`,
    };
    
    return descriptions[rule.type] || 'Concern ético identificado';
  }
  
  /**
   * Avalia viabilidade prática
   */
  private assessFeasibility(content: string, query: string): GammaContextualOutput['feasibilityAssessment'] {
    const combined = `${query}\n${content}`;
    
    // Avaliar recursos necessários
    const requiredResources = this.identifyRequiredResources(combined);
    
    // Estimar timeline
    const timelineEstimate = this.estimateTimeline(combined);
    
    // Calcular score de complexidade
    const complexityScore = this.calculateComplexityScore(combined);
    
    // Determinar viabilidade técnica
    const technicalFeasibility = this.determineTechnicalFeasibility(complexityScore, requiredResources.length);
    
    return {
      technicalFeasibility,
      requiredResources,
      timelineEstimate,
      complexityScore,
    };
  }
  
  /**
   * Identifica recursos necessários
   */
  private identifyRequiredResources(content: string): string[] {
    const resources: string[] = [];
    
    const resourcePatterns: Array<{ pattern: RegExp; resource: string }> = [
      { pattern: /api externa|external api/i, resource: 'Integração com API externa' },
      { pattern: /banco de dados|database/i, resource: 'Banco de dados' },
      { pattern: /autenticação|authentication/i, resource: 'Sistema de autenticação' },
      { pattern: /infraestrutura|infrastructure/i, resource: 'Infraestrutura de servidor' },
      { pattern: /machine learning|ml|ia|ai/i, resource: 'Recursos de ML/IA' },
      { pattern: /equipe|team/i, resource: 'Equipe de desenvolvimento' },
      { pattern: /design|ui|ux/i, resource: 'Design/UX' },
      { pattern: /testes|testing/i, resource: 'Suite de testes' },
    ];
    
    for (const { pattern, resource } of resourcePatterns) {
      if (pattern.test(content)) {
        resources.push(resource);
      }
    }
    
    return [...new Set(resources)];
  }
  
  /**
   * Estima timeline
   */
  private estimateTimeline(content: string): string {
    if (FEASIBILITY_INDICATORS.timeline.long.some(p => p.test(content))) {
      return '3-6 meses';
    }
    if (FEASIBILITY_INDICATORS.timeline.medium.some(p => p.test(content))) {
      return '2-4 semanas';
    }
    if (FEASIBILITY_INDICATORS.timeline.short.some(p => p.test(content))) {
      return '1-5 dias';
    }
    
    // Estimar baseado na complexidade do texto
    const wordCount = content.split(/\s+/).length;
    if (wordCount > 500) return '2-4 semanas';
    if (wordCount > 200) return '1-2 semanas';
    return '1-3 dias';
  }
  
  /**
   * Calcula score de complexidade
   */
  private calculateComplexityScore(content: string): number {
    let score = 0.3; // Base
    
    // Indicadores de complexidade
    const complexityIndicators = [
      { pattern: /integração|integration/i, weight: 0.1 },
      { pattern: /distribuído|distributed/i, weight: 0.2 },
      { pattern: /escalável|scalable/i, weight: 0.1 },
      { pattern: /microservic/i, weight: 0.2 },
      { pattern: /real.?time/i, weight: 0.1 },
      { pattern: /segurança crítica|critical security/i, weight: 0.15 },
      { pattern: /múltiplos (sistemas|serviços)/i, weight: 0.15 },
    ];
    
    for (const { pattern, weight } of complexityIndicators) {
      if (pattern.test(content)) {
        score += weight;
      }
    }
    
    return Math.min(1, score);
  }
  
  /**
   * Determina viabilidade técnica
   */
  private determineTechnicalFeasibility(
    complexityScore: number,
    resourceCount: number
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    const combinedScore = (complexityScore + resourceCount * 0.1) / 2;
    
    if (combinedScore < 0.3) return 'HIGH'; // Alta viabilidade
    if (combinedScore < 0.6) return 'MEDIUM';
    return 'LOW'; // Baixa viabilidade (muito complexo)
  }
  
  /**
   * Gera sugestões de enriquecimento
   */
  private generateEnrichmentSuggestions(
    alphaContent: string,
    betaContent: string,
    ethicalFlags: GammaContextualOutput['ethicalFlags']
  ): string[] {
    const suggestions: string[] = [];
    
    // Sugestões baseadas em flags éticos
    if (ethicalFlags.some(f => f.type === 'PRIVACY')) {
      suggestions.push('Adicionar seção sobre proteção de dados e conformidade com LGPD/GDPR');
    }
    if (ethicalFlags.some(f => f.type === 'BIAS')) {
      suggestions.push('Incluir estratégias de mitigação de viés algorítmico');
    }
    if (ethicalFlags.some(f => f.type === 'SAFETY')) {
      suggestions.push('Detalhar mecanismos de fallback e recuperação de erros');
    }
    
    // Sugestões de equilíbrio entre Alpha e Beta
    const alphaLength = alphaContent.length;
    const betaLength = betaContent.length;
    
    if (alphaLength > betaLength * 2) {
      suggestions.push('Balancear com perspectivas mais criativas e visionárias');
    } else if (betaLength > alphaLength * 2) {
      suggestions.push('Adicionar mais fundamentação técnica e dados concretos');
    }
    
    // Sugestões gerais de qualidade
    if (!alphaContent.includes('```') && !betaContent.includes('```')) {
      suggestions.push('Incluir exemplos de código quando aplicável');
    }
    
    return suggestions.slice(0, 5);
  }
  
  /**
   * Identifica restrições práticas
   */
  private identifyPracticalConstraints(content: string): string[] {
    const constraints: string[] = [];
    
    const constraintPatterns: Array<{ pattern: RegExp; constraint: string }> = [
      { pattern: /tempo limitado|limited time/i, constraint: 'Restrição de tempo' },
      { pattern: /orçamento (limitado|restrito)|limited budget/i, constraint: 'Restrição orçamentária' },
      { pattern: /legacy|sistema antigo/i, constraint: 'Integração com sistema legado' },
      { pattern: /regulamentação|compliance|lgpd|gdpr/i, constraint: 'Conformidade regulatória' },
      { pattern: /performance crítica|high performance/i, constraint: 'Requisitos de performance' },
    ];
    
    for (const { pattern, constraint } of constraintPatterns) {
      if (pattern.test(content)) {
        constraints.push(constraint);
      }
    }
    
    return constraints;
  }
  
  /**
   * Obtém as regras éticas ativas
   */
  getActiveRules(): EthicalRule[] {
    return ETHICAL_RULES;
  }
}

// Singleton
export const GammaModule = new GammaModuleService();
export default GammaModule;
