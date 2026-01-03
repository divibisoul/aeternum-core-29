/**
 * FASE 3: PROMPT CRAFTER
 * 
 * Artesão de Prompts - Gera prompts cirúrgicos e específicos para a API.
 * 
 * Funções:
 * - Constrói prompts otimizados baseados no contexto
 * - Adapta instruções para tipo específico de tarefa
 * - Integra contexto do Code Vault quando disponível
 * - Maximiza a qualidade das respostas
 */

import type { InterceptionResult, ExecutionMode, ResponseType } from './PragmaticInterceptor';
import type { SearchResult } from './CodeVault';

// Interface para o prompt craftado
export interface CraftedPrompt {
  systemPrompt: string;
  userPrompt: string;
  contextInjection: string;
  specialInstructions: string[];
  temperature: number;
  maxTokens: number;
}

// Templates de sistema por tipo
const SYSTEM_TEMPLATES = {
  CODE: `Você é um engenheiro de software sênior especialista. Você escreve código:
- LIMPO, legível e bem estruturado
- FUNCIONAL e testável
- Com tratamento de erros apropriado
- Seguindo as melhores práticas da linguagem
- Com comentários apenas quando necessário para clareza

REGRAS ABSOLUTAS:
1. Retorne código COMPLETO e EXECUTÁVEL
2. NÃO use placeholders como "// implementar aqui"
3. Inclua imports necessários
4. Considere edge cases
5. NÃO explique o código extensivamente - deixe o código falar por si`,

  CALCULATION: `Você é um matemático e cientista de dados especialista. Você:
- Resolve problemas com PRECISÃO absoluta
- Mostra PASSOS de forma clara e concisa
- Usa notação matemática apropriada
- Verifica suas respostas
- Identifica pressupostos e limitações

REGRAS ABSOLUTAS:
1. Mostre o trabalho passo a passo
2. Chegue a uma resposta DEFINITIVA
3. Use formatação clara para equações
4. Verifique o resultado se possível
5. NÃO divague - vá direto ao ponto`,

  ANALYSIS: `Você é um analista de dados e pesquisador sênior. Você:
- Examina dados com RIGOR metodológico
- Identifica padrões e anomalias
- Apresenta insights ACIONÁVEIS
- Usa evidências para suportar conclusões
- Considera múltiplas perspectivas

REGRAS ABSOLUTAS:
1. Estruture a análise de forma clara
2. Separe FATOS de INFERÊNCIAS
3. Conclua com RECOMENDAÇÕES práticas
4. Seja objetivo e baseado em dados
5. NÃO faça afirmações sem suporte`,

  CREATIVE: `Você é um criativo e estrategista de ideias. Você:
- Gera conteúdo ORIGINAL e envolvente
- Pensa fora da caixa
- Combina conceitos de formas inesperadas
- Mantém qualidade e utilidade
- Adapta tom ao contexto

REGRAS ABSOLUTAS:
1. Seja INOVADOR mas relevante
2. Entregue conteúdo de ALTA qualidade
3. Mantenha coerência e propósito
4. Surpreenda positivamente
5. NÃO seja genérico ou clichê`,

  GENERAL: `Você é um assistente superinteligente focado em RESOLVER PROBLEMAS.
- Respostas DIRETAS e objetivas
- Foco no que o usuário PRECISA
- Sem rodeios ou filler
- Informação precisa e útil
- Tom profissional mas acessível

REGRAS ABSOLUTAS:
1. Responda a pergunta DIRETAMENTE
2. NÃO fale sobre você mesmo
3. NÃO explique sua arquitetura
4. Seja CONCISO
5. Foque em AÇÃO e utilidade`,
};

// Templates de precisão por complexidade
const COMPLEXITY_TEMPLATES = {
  extreme: `
TAREFA DE ALTA COMPLEXIDADE DETECTADA:
- Divida em componentes gerenciáveis
- Trate cada parte com cuidado
- Considere interdependências
- Valide cada etapa
- Documente decisões críticas`,

  high: `
TAREFA COMPLEXA:
- Estruture sua resposta em seções claras
- Seja detalhado onde necessário
- Mantenha foco no objetivo principal`,

  medium: '',
  
  low: `
TAREFA SIMPLES:
- Resposta direta e concisa
- Sem elaborações desnecessárias`,
};

// Templates de linguagem
const LANGUAGE_TEMPLATES = {
  pt: {
    codeContext: 'Código relevante encontrado na base de conhecimento:',
    noContext: 'Nenhum código similar encontrado. Gerando solução original.',
    followUp: 'Precisa de mais detalhes sobre alguma parte?',
  },
  en: {
    codeContext: 'Relevant code found in knowledge base:',
    noContext: 'No similar code found. Generating original solution.',
    followUp: 'Need more details on any part?',
  },
  es: {
    codeContext: 'Código relevante encontrado en la base de conocimiento:',
    noContext: 'No se encontró código similar. Generando solución original.',
    followUp: '¿Necesitas más detalles sobre alguna parte?',
  },
};

/**
 * PromptCrafter - Serviço de Construção de Prompts
 */
class PromptCrafterService {
  /**
   * Constrói um prompt otimizado baseado na interceptação e contexto
   */
  build(
    interception: InterceptionResult,
    codeContext: SearchResult[] = [],
    browserLang: string = 'pt'
  ): CraftedPrompt {
    const { executionMode, responseType, complexity, keywords } = interception;
    
    // Selecionar template base
    const baseSystem = this.selectSystemTemplate(responseType);
    
    // Adicionar instruções de complexidade
    const complexityInstructions = COMPLEXITY_TEMPLATES[complexity] || '';
    
    // Construir injeção de contexto
    const contextInjection = this.buildContextInjection(codeContext, browserLang);
    
    // Instruções especiais baseadas em keywords
    const specialInstructions = this.buildSpecialInstructions(keywords, executionMode);
    
    // Construir prompt do sistema final
    const systemPrompt = this.assembleSystemPrompt(
      baseSystem,
      complexityInstructions,
      interception.injectPrompt,
      specialInstructions
    );
    
    // Construir prompt do usuário
    const userPrompt = this.buildUserPrompt(interception, contextInjection);
    
    // Determinar parâmetros
    const temperature = this.selectTemperature(executionMode, complexity);
    const maxTokens = this.selectMaxTokens(responseType, complexity);
    
    return {
      systemPrompt,
      userPrompt,
      contextInjection,
      specialInstructions,
      temperature,
      maxTokens,
    };
  }
  
  /**
   * Seleciona o template de sistema baseado no tipo de resposta
   */
  private selectSystemTemplate(responseType: ResponseType): string {
    switch (responseType) {
      case 'CODE':
        return SYSTEM_TEMPLATES.CODE;
      case 'CALCULATION':
        return SYSTEM_TEMPLATES.CALCULATION;
      case 'ANALYSIS':
        return SYSTEM_TEMPLATES.ANALYSIS;
      case 'CREATIVE':
        return SYSTEM_TEMPLATES.CREATIVE;
      default:
        return SYSTEM_TEMPLATES.GENERAL;
    }
  }
  
  /**
   * Constrói injeção de contexto do Code Vault
   */
  private buildContextInjection(
    codeContext: SearchResult[],
    lang: string
  ): string {
    const templates = LANGUAGE_TEMPLATES[lang as keyof typeof LANGUAGE_TEMPLATES] || LANGUAGE_TEMPLATES.en;
    
    if (codeContext.length === 0) {
      return '';
    }
    
    let injection = `\n\n${templates.codeContext}\n`;
    
    // Adicionar até 3 snippets mais relevantes
    const topSnippets = codeContext.slice(0, 3);
    
    for (const result of topSnippets) {
      injection += `
---
Linguagem: ${result.snippet.language}
Descrição: ${result.snippet.description}
Relevância: ${(result.relevanceScore * 100).toFixed(0)}%
Tags: ${result.matchedTags.join(', ')}

\`\`\`${result.snippet.language}
${result.snippet.code}
\`\`\`
---`;
    }
    
    injection += `\n\nUse o código acima como REFERÊNCIA. Adapte conforme necessário para o problema atual.\n`;
    
    return injection;
  }
  
  /**
   * Constrói instruções especiais baseadas em keywords
   */
  private buildSpecialInstructions(keywords: string[], mode: ExecutionMode): string[] {
    const instructions: string[] = [];
    
    // Instruções baseadas em tecnologias detectadas
    const techInstructions: Record<string, string> = {
      'react': 'Use React hooks e componentes funcionais. Prefira TypeScript.',
      'typescript': 'Use tipos fortes. Evite "any". Defina interfaces quando apropriado.',
      'python': 'Use type hints. Siga PEP 8. Considere edge cases.',
      'sql': 'Otimize para performance. Previna SQL injection. Use índices apropriados.',
      'api': 'Considere autenticação, rate limiting e tratamento de erros.',
      'docker': 'Use multi-stage builds. Minimize tamanho da imagem.',
      'algorithm': 'Analise complexidade O(n). Otimize quando possível.',
    };
    
    for (const keyword of keywords) {
      const instruction = techInstructions[keyword.toLowerCase()];
      if (instruction) {
        instructions.push(instruction);
      }
    }
    
    // Instruções baseadas no modo
    if (mode === 'TECHNICAL') {
      instructions.push('Priorize código funcional e testável.');
      instructions.push('Inclua tratamento de erros adequado.');
    }
    
    if (mode === 'ANALYSIS') {
      instructions.push('Baseie conclusões em evidências.');
      instructions.push('Quantifique quando possível.');
    }
    
    return instructions;
  }
  
  /**
   * Monta o prompt de sistema final
   */
  private assembleSystemPrompt(
    base: string,
    complexity: string,
    interceptorInject: string,
    specialInstructions: string[]
  ): string {
    let prompt = base;
    
    if (complexity) {
      prompt += `\n${complexity}`;
    }
    
    if (interceptorInject) {
      prompt += `\n${interceptorInject}`;
    }
    
    if (specialInstructions.length > 0) {
      prompt += `\n\nINSTRUÇÕES ESPECÍFICAS:\n`;
      specialInstructions.forEach((inst, i) => {
        prompt += `${i + 1}. ${inst}\n`;
      });
    }
    
    // Adicionar lembrete final
    prompt += `\n\n---
LEMBRETE FINAL: 
- Seja DIRETO e ÚTIL
- NÃO fale sobre você mesmo ou sua arquitetura
- FOCO 100% no problema do usuário
- Qualidade > Quantidade`;
    
    return prompt;
  }
  
  /**
   * Constrói o prompt do usuário
   */
  private buildUserPrompt(
    interception: InterceptionResult,
    contextInjection: string
  ): string {
    let prompt = interception.originalInput;
    
    if (contextInjection) {
      prompt += contextInjection;
    }
    
    return prompt;
  }
  
  /**
   * Seleciona temperatura baseada no modo e complexidade
   */
  private selectTemperature(mode: ExecutionMode, complexity: string): number {
    // Código e cálculo precisam de precisão (temperatura baixa)
    if (mode === 'TECHNICAL') {
      return complexity === 'extreme' ? 0.3 : 0.5;
    }
    
    // Análise precisa de equilíbrio
    if (mode === 'ANALYSIS') {
      return 0.5;
    }
    
    // Criativo pode ter mais liberdade
    if (mode === 'CREATIVE') {
      return 0.8;
    }
    
    // Padrão
    return 0.7;
  }
  
  /**
   * Seleciona max tokens baseado no tipo e complexidade
   */
  private selectMaxTokens(responseType: ResponseType, complexity: string): number {
    const baseTokens: Record<ResponseType, number> = {
      'CODE': 4096,
      'CALCULATION': 2048,
      'ANALYSIS': 4096,
      'CREATIVE': 4096,
      'EXPLANATION': 2048,
      'ACTION': 1024,
      'META_RESPONSE': 512,
    };
    
    const complexityMultiplier: Record<string, number> = {
      'extreme': 2.0,
      'high': 1.5,
      'medium': 1.0,
      'low': 0.75,
    };
    
    const base = baseTokens[responseType] || 2048;
    const multiplier = complexityMultiplier[complexity] || 1.0;
    
    return Math.min(Math.round(base * multiplier), 8192);
  }
  
  /**
   * Gera prompt rápido para tarefas simples (sem todo o processamento)
   */
  quickBuild(input: string, type: 'code' | 'math' | 'general' = 'general'): CraftedPrompt {
    const templates = {
      code: SYSTEM_TEMPLATES.CODE,
      math: SYSTEM_TEMPLATES.CALCULATION,
      general: SYSTEM_TEMPLATES.GENERAL,
    };
    
    return {
      systemPrompt: templates[type],
      userPrompt: input,
      contextInjection: '',
      specialInstructions: [],
      temperature: type === 'code' ? 0.5 : 0.7,
      maxTokens: 4096,
    };
  }
}

// Singleton
export const PromptCrafter = new PromptCrafterService();

export default PromptCrafter;
