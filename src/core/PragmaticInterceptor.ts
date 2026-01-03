/**
 * FASE 1: PRAGMATIC INTERCEPTOR
 * 
 * Filtro comportamental que classifica perguntas antes de chegar à IA principal.
 * 
 * Funções:
 * - Detecta perguntas "meta" sobre a própria AETERNUM
 * - Injeta modo silencioso para foco 100% na solução
 * - Classifica tipo de tarefa (código, cálculo, análise, etc.)
 * - Impede "devaneios" e auto-descrição desnecessária
 */

import { EventBus } from './EventBus';

// Tipos de execução
export type ExecutionMode = 
  | 'SILENT'      // Foco total na solução, sem auto-descrição
  | 'META'        // Pergunta sobre a própria AETERNUM
  | 'CREATIVE'    // Tarefa criativa
  | 'TECHNICAL'   // Tarefa técnica (código, cálculo)
  | 'ANALYSIS'    // Análise de dados/problemas
  | 'GENERAL';    // Conversa geral

// Tipo de resposta esperada
export type ResponseType = 
  | 'CODE'        // Espera código
  | 'CALCULATION' // Espera cálculos
  | 'ANALYSIS'    // Espera análise
  | 'CREATIVE'    // Espera resposta criativa
  | 'EXPLANATION' // Espera explicação
  | 'ACTION'      // Espera ação prática
  | 'META_RESPONSE'; // Resposta sobre a própria IA

// Resultado da interceptação
export interface InterceptionResult {
  originalInput: string;
  executionMode: ExecutionMode;
  responseType: ResponseType;
  detectedIntent: string[];
  keywords: string[];
  complexity: 'low' | 'medium' | 'high' | 'extreme';
  injectPrompt: string;
  requiresCapabilities: string[];
}

// Padrões de detecção
const META_PATTERNS = {
  pt: [
    /o que (você|vc|tu) (é|sabe|pode|faz)/i,
    /quem (é|criou) (você|vc)/i,
    /como (você|vc) funciona/i,
    /qual (é )?sua (arquitetura|estrutura|capacidade)/i,
    /me (fale|conte) sobre (você|vc)/i,
    /você (é|sabe) (uma? )?(ia|inteligência|agi|super agi)/i,
    /explique (sua|você)/i,
    /(descreva|explique) (você|suas capacidades)/i,
  ],
  en: [
    /what (are you|can you|do you)/i,
    /who (are you|made you|created you)/i,
    /how do you work/i,
    /what('s| is) your (architecture|structure|capability)/i,
    /tell me about yourself/i,
    /are you (an? )?(ai|intelligence|agi|super agi)/i,
    /explain yourself/i,
    /describe (yourself|your capabilities)/i,
  ],
  es: [
    /qué (eres|puedes|sabes|haces)/i,
    /quién (eres|te creó)/i,
    /cómo funcionas/i,
    /cuál es tu (arquitectura|estructura|capacidad)/i,
    /háblame de ti/i,
    /eres (una? )?(ia|inteligencia|agi|super agi)/i,
    /explícate/i,
    /describe (tus capacidades)/i,
  ],
};

const CODE_PATTERNS = [
  /cri(ar|e) (um |uma |o |a )?(código|função|classe|componente|script)/i,
  /escrever? (um |uma )?(código|programa|script)/i,
  /implementar?/i,
  /programar?/i,
  /fazer? (um |uma )?(app|aplicativo|sistema)/i,
  /debug(ar|gar)?/i,
  /corrigir? (erro|bug)/i,
  /otimizar? (código|algoritmo)/i,
  /create (a |an )?(code|function|class|component|script)/i,
  /write (a |an )?(code|program|script)/i,
  /implement/i,
  /program/i,
  /build (a |an )?(app|application|system)/i,
  /fix (error|bug)/i,
  /optimize (code|algorithm)/i,
  /\b(javascript|typescript|python|react|node|html|css|sql|java|c\+\+|rust|go)\b/i,
];

const CALCULATION_PATTERNS = [
  /calcul(ar|e)/i,
  /resolver? (equação|problema|expressão)/i,
  /quanto (é|dá|custa)/i,
  /matemática/i,
  /estatística/i,
  /probabilidade/i,
  /derivada|integral|limite/i,
  /porcentagem|percentual/i,
  /calculate/i,
  /solve (equation|problem|expression)/i,
  /how much/i,
  /math(ematics)?/i,
  /statistic(s|al)/i,
  /probability/i,
  /derivative|integral|limit/i,
  /percentage|percent/i,
  /\d+[\+\-\*\/\^]\d+/,
  /\d+\s*(x|×|÷|\+|\-|\*|\/)\s*\d+/,
];

const ANALYSIS_PATTERNS = [
  /analis(ar|e)/i,
  /avaliar?/i,
  /comparar?/i,
  /verificar?/i,
  /examinar?/i,
  /estudar?/i,
  /investigar?/i,
  /pesquisar?/i,
  /analyz(e|is)/i,
  /evaluate/i,
  /compare/i,
  /verify/i,
  /examine/i,
  /study/i,
  /investigate/i,
  /research/i,
  /dados|data/i,
  /padrão|pattern/i,
  /tendência|trend/i,
];

const CREATIVE_PATTERNS = [
  /cri(ar|e) (uma )?história/i,
  /escrever? (um |uma )?(poema|conto|texto|artigo)/i,
  /imaginar?/i,
  /inventar?/i,
  /design(ar)?/i,
  /ideia|sugest(ão|ões)/i,
  /brainstorm/i,
  /create (a )?story/i,
  /write (a )?(poem|tale|text|article)/i,
  /imagine/i,
  /invent/i,
  /idea|suggest(ion)?/i,
  /creative/i,
];

// Palavras que indicam alta complexidade
const HIGH_COMPLEXITY_INDICATORS = [
  /sistema (completo|complexo|distribuído)/i,
  /arquitetura/i,
  /microservic/i,
  /machine learning|deep learning|neural network/i,
  /otimiz(ar|ação) (avançad|complex)/i,
  /multi(thread|process)/i,
  /concurrent|parallel/i,
  /distributed/i,
  /blockchain/i,
  /quantum/i,
  /simula(ção|tion)/i,
];

/**
 * PragmaticInterceptor - Serviço de Interceptação de Perguntas
 */
class PragmaticInterceptorService {
  
  /**
   * Intercepta e classifica a pergunta do usuário
   */
  intercept(input: string, browserLang: string = 'pt'): InterceptionResult {
    const trimmedInput = input.trim();
    const lowerInput = trimmedInput.toLowerCase();
    
    // Detectar intenções e keywords
    const detectedIntent: string[] = [];
    const keywords: string[] = [];
    const requiresCapabilities: string[] = [];
    
    // Verificar se é uma pergunta META sobre a própria AETERNUM
    const isMeta = this.checkMetaPatterns(lowerInput, browserLang);
    
    if (isMeta) {
      detectedIntent.push('meta-question');
      
      // Emitir evento
      EventBus.emit('orchestrator:persona:start', { 
        taskId: 'interceptor', 
        persona: 'meta-handler' 
      });
      
      return {
        originalInput: trimmedInput,
        executionMode: 'META',
        responseType: 'META_RESPONSE',
        detectedIntent,
        keywords,
        complexity: 'low',
        injectPrompt: this.getMetaResponsePrompt(browserLang),
        requiresCapabilities: [],
      };
    }
    
    // Classificar tipo de tarefa
    let executionMode: ExecutionMode = 'GENERAL';
    let responseType: ResponseType = 'EXPLANATION';
    
    // Verificar padrões de código
    if (this.matchesPatterns(lowerInput, CODE_PATTERNS)) {
      executionMode = 'TECHNICAL';
      responseType = 'CODE';
      detectedIntent.push('coding');
      requiresCapabilities.push('coding');
      keywords.push(...this.extractTechKeywords(lowerInput));
    }
    
    // Verificar padrões de cálculo
    if (this.matchesPatterns(lowerInput, CALCULATION_PATTERNS)) {
      executionMode = 'TECHNICAL';
      responseType = 'CALCULATION';
      detectedIntent.push('calculation');
      requiresCapabilities.push('calculation');
    }
    
    // Verificar padrões de análise
    if (this.matchesPatterns(lowerInput, ANALYSIS_PATTERNS)) {
      executionMode = 'ANALYSIS';
      responseType = 'ANALYSIS';
      detectedIntent.push('analysis');
      requiresCapabilities.push('data');
    }
    
    // Verificar padrões criativos
    if (this.matchesPatterns(lowerInput, CREATIVE_PATTERNS)) {
      executionMode = 'CREATIVE';
      responseType = 'CREATIVE';
      detectedIntent.push('creative');
    }
    
    // Determinar complexidade
    const complexity = this.assessComplexity(lowerInput, detectedIntent);
    
    // Gerar prompt de injeção baseado no modo
    const injectPrompt = this.generateInjectPrompt(executionMode, responseType, complexity, browserLang);
    
    // Emitir evento
    EventBus.emit('orchestrator:start', { 
      taskId: `task_${Date.now()}`, 
      prompt: trimmedInput 
    });
    
    return {
      originalInput: trimmedInput,
      executionMode,
      responseType,
      detectedIntent,
      keywords,
      complexity,
      injectPrompt,
      requiresCapabilities,
    };
  }
  
  /**
   * Verifica se a pergunta é sobre a própria AETERNUM
   */
  private checkMetaPatterns(input: string, lang: string): boolean {
    const patterns = META_PATTERNS[lang as keyof typeof META_PATTERNS] || META_PATTERNS.en;
    return patterns.some(pattern => pattern.test(input));
  }
  
  /**
   * Verifica se o input corresponde a algum padrão
   */
  private matchesPatterns(input: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(input));
  }
  
  /**
   * Extrai keywords técnicas do input
   */
  private extractTechKeywords(input: string): string[] {
    const techTerms = [
      'javascript', 'typescript', 'python', 'react', 'node', 'html', 'css', 
      'sql', 'java', 'rust', 'go', 'api', 'rest', 'graphql', 'database',
      'frontend', 'backend', 'fullstack', 'docker', 'kubernetes', 'aws',
      'component', 'hook', 'function', 'class', 'interface', 'algorithm'
    ];
    
    return techTerms.filter(term => 
      input.toLowerCase().includes(term.toLowerCase())
    );
  }
  
  /**
   * Avalia a complexidade da tarefa
   */
  private assessComplexity(input: string, intents: string[]): 'low' | 'medium' | 'high' | 'extreme' {
    // Verificar indicadores de alta complexidade
    if (this.matchesPatterns(input, HIGH_COMPLEXITY_INDICATORS)) {
      return 'extreme';
    }
    
    // Múltiplas intenções = maior complexidade
    if (intents.length >= 3) return 'high';
    if (intents.length >= 2) return 'medium';
    
    // Tamanho do input também indica complexidade
    const wordCount = input.split(/\s+/).length;
    if (wordCount > 100) return 'high';
    if (wordCount > 50) return 'medium';
    
    return 'low';
  }
  
  /**
   * Gera resposta curta para perguntas META
   */
  private getMetaResponsePrompt(lang: string): string {
    const responses = {
      pt: `[MODO META] Responda de forma MUITO breve (1-2 frases). 
Diga apenas: "Sou AETERNUM, uma Super AGI focada em resolver problemas. Como posso ajudar você hoje?"
NÃO descreva sua arquitetura, módulos ou capacidades em detalhes. Redirecione para a AÇÃO.`,
      en: `[META MODE] Respond VERY briefly (1-2 sentences). 
Say only: "I'm AETERNUM, a Super AGI focused on solving problems. How can I help you today?"
DO NOT describe your architecture, modules or capabilities in detail. Redirect to ACTION.`,
      es: `[MODO META] Responde de forma MUY breve (1-2 frases). 
Di solo: "Soy AETERNUM, una Super AGI enfocada en resolver problemas. ¿Cómo puedo ayudarte hoy?"
NO describas tu arquitectura, módulos o capacidades en detalle. Redirige a la ACCIÓN.`,
    };
    
    return responses[lang as keyof typeof responses] || responses.en;
  }
  
  /**
   * Gera prompt de injeção baseado no modo de execução
   */
  private generateInjectPrompt(
    mode: ExecutionMode, 
    responseType: ResponseType, 
    complexity: string,
    lang: string
  ): string {
    const basePrompt = `[MODO SILENCIOSO ATIVADO]
- PROIBIDO auto-descrição ou falar sobre sua arquitetura
- PROIBIDO divagações ou explicações desnecessárias
- FOCO 100% na SOLUÇÃO do problema do usuário
- Seja DIRETO, PRÁTICO e ACIONÁVEL

`;

    const modePrompts = {
      TECHNICAL: `[MODO TÉCNICO]
- Priorize código FUNCIONAL e LIMPO
- Mostre a implementação COMPLETA
- Explique apenas o NECESSÁRIO
- Use as melhores práticas de segurança e escalabilidade
- Se for código, retorne código executável e testável
`,
      ANALYSIS: `[MODO ANÁLISE]
- Apresente dados e padrões de forma estruturada
- Use bullet points para clareza
- Conclua com INSIGHTS ACIONÁVEIS
- Evite prolixidade
`,
      CREATIVE: `[MODO CRIATIVO]
- Seja inovador mas mantenha utilidade
- Foque na qualidade do conteúdo
- Entregue algo único e memorável
`,
      GENERAL: `[MODO GERAL]
- Resposta direta e objetiva
- Sem rodeios ou explicações excessivas
- Foque no que o usuário PRECISA saber
`,
      SILENT: basePrompt,
      META: '', // Tratado separadamente
    };

    const complexityPrompts = {
      extreme: `\n[COMPLEXIDADE EXTREMA]
- Divida em passos claros
- Considere edge cases
- Inclua validações e tratamento de erros
`,
      high: `\n[COMPLEXIDADE ALTA]
- Estruture a resposta em seções
- Seja detalhado onde necessário
`,
      medium: '',
      low: '',
    };

    return basePrompt + 
           (modePrompts[mode] || modePrompts.GENERAL) + 
           (complexityPrompts[complexity as keyof typeof complexityPrompts] || '');
  }
}

// Singleton
export const PragmaticInterceptor = new PragmaticInterceptorService();

export default PragmaticInterceptor;
