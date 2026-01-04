/**
 * BETA HEMISPHERE (CRIATIVO/INTUITIVO)
 * 
 * Responsável pelo processamento criativo, intuitivo e divergente.
 * Foca em:
 * - Pensamento lateral
 * - Metáforas e analogias
 * - Soluções inovadoras
 * - Visão de futuro
 */

import type { HemisphereOutput, IntentProfile } from './types';

// Templates de prompt para Beta
const BETA_PROMPTS = {
  default: `Você é o hemisfério BETA (criativo/intuitivo). Sua missão:
1. Explorar perspectivas NÃO ÓBVIAS
2. Usar metáforas e analogias para enriquecer
3. Propor soluções VISIONÁRIAS mas ancoradas
4. Focar em "e se..." e conexões inesperadas
5. Balancear OUSADIA com praticidade

PROIBIDO: Respostas genéricas, clichês, falta de originalidade.
FOCO: Ideias que SURPREENDEM positivamente.`,

  divergent: `Você é um pensador altamente divergente. Sua missão:
1. QUEBRAR padrões de pensamento convencional
2. Conectar ideias de domínios completamente diferentes
3. Propor o INESPERADO mas útil
4. Usar analogias poderosas
5. Desafiar pressupostos

PROIBIDO: Óbvio, esperado, convencional.
FOCO: Originalidade que INSPIRA.`,

  visionary: `Você é um visionário estratégico. Sua missão:
1. Pensar em FUTURO e possibilidades
2. Identificar tendências emergentes
3. Propor cenários transformadores
4. Conectar presente com futuro
5. Inspirar ação através de visão

PROIBIDO: Pessimismo, limitações auto-impostas.
FOCO: Possibilidades que MOTIVAM.`,

  metaphorical: `Você é um mestre das metáforas. Sua missão:
1. Explicar conceitos através de ANALOGIAS poderosas
2. Criar narrativas que facilitam compreensão
3. Usar exemplos vívidos e memoráveis
4. Transformar o abstrato em concreto
5. Tornar o complexo ACESSÍVEL

PROIBIDO: Explicações secas, técnicas demais.
FOCO: Compreensão através de HISTÓRIA.`,
};

// Tags criativas detectáveis
const CREATIVITY_TAGS = [
  'metaphor', 'lateral_thinking', 'visionary', 'innovative',
  'unconventional', 'imaginative', 'original', 'inspiring',
  'storytelling', 'analogical', 'future_oriented', 'bold',
];

// Padrões criativos para enriquecer
const CREATIVE_PATTERNS = [
  { name: 'metaphor', regex: /como (se fosse|um|uma)|é como|imagine que|think of it as/i },
  { name: 'lateral_thinking', regex: /e se|what if|por outro lado|alternatively/i },
  { name: 'visionary', regex: /no futuro|in the future|podemos imaginar|could become/i },
  { name: 'storytelling', regex: /imagine|picture this|let me tell you|era uma vez/i },
  { name: 'innovative', regex: /nova abordagem|new approach|diferente|unique|inovador/i },
];

/**
 * BetaHemisphere - Processador Criativo/Intuitivo
 */
class BetaHemisphereService {
  /**
   * Processa a query através da lente criativa
   */
  process(
    query: string,
    intent: IntentProfile
  ): { systemPrompt: string; temperature: number; expectedTags: string[] } {
    // Selecionar prompt baseado no nível de criatividade necessário
    const creativityLevel = intent.weights.creative;
    const systemPrompt = this.selectPrompt(creativityLevel, intent);
    
    // Determinar temperatura (alta para criatividade)
    const temperature = this.selectTemperature(creativityLevel);
    
    // Tags esperadas
    const expectedTags = this.predictCreativityTags(intent);
    
    console.log('[BetaHemisphere] Processing with config:', {
      creativityLevel,
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
   * Analisa a resposta e extrai metadados criativos
   */
  analyzeResponse(
    response: string,
    startTime: number
  ): Omit<HemisphereOutput, 'content'> {
    const processingTimeMs = Date.now() - startTime;
    
    // Extrair tags criativas
    const creativityTags = this.extractCreativityTags(response);
    
    // Calcular scores
    const originalityScore = this.evaluateOriginality(response);
    const usefulnessScore = this.evaluateUsefulness(response);
    
    // Confiança baseada em originalidade e utilidade
    const confidence = (originalityScore * 0.4 + usefulnessScore * 0.6);
    
    // Extrair padrões criativos usados
    const patterns = this.extractPatterns(response);
    
    return {
      confidence,
      processingTimeMs,
      metadata: {
        logicTags: [], // Beta não tem tags lógicas primárias
        creativityTags,
        patterns,
      },
    };
  }
  
  /**
   * Seleciona o prompt apropriado
   */
  private selectPrompt(creativityLevel: number, intent: IntentProfile): string {
    if (creativityLevel < 0.3) {
      // Modo minimalista criativo
      return BETA_PROMPTS.default;
    }
    
    if (creativityLevel > 0.7) {
      // Modo altamente divergente
      return BETA_PROMPTS.divergent;
    }
    
    // Escolher baseado no domínio
    if (intent.metadata.domain === 'business' || intent.metadata.domain === 'science') {
      return BETA_PROMPTS.visionary;
    }
    
    if (intent.metadata.complexity === 'high' || intent.metadata.complexity === 'extreme') {
      return BETA_PROMPTS.metaphorical;
    }
    
    return BETA_PROMPTS.default;
  }
  
  /**
   * Seleciona temperatura (alta para criatividade)
   */
  private selectTemperature(creativityLevel: number): number {
    if (creativityLevel < 0.3) return 0.6;
    if (creativityLevel > 0.7) return 0.9;
    return 0.75;
  }
  
  /**
   * Prevê tags criativas esperadas
   */
  private predictCreativityTags(intent: IntentProfile): string[] {
    const tags: string[] = [];
    
    if (intent.weights.creative > 0.5) {
      tags.push('innovative', 'original');
    }
    if (intent.metadata.complexity === 'high') {
      tags.push('metaphor', 'analogical');
    }
    if (intent.metadata.domain === 'creative') {
      tags.push('imaginative', 'storytelling');
    }
    
    return tags;
  }
  
  /**
   * Extrai tags criativas da resposta
   */
  private extractCreativityTags(response: string): string[] {
    const tags: string[] = [];
    
    for (const pattern of CREATIVE_PATTERNS) {
      if (pattern.regex.test(response)) {
        tags.push(pattern.name);
      }
    }
    
    // Detectar padrões adicionais
    if (/!|\?{2,}|\.{3}/g.test(response)) {
      tags.push('expressive');
    }
    if (response.split('\n').some(line => line.startsWith('>'))) {
      tags.push('narrative');
    }
    if (/\b(novo|new|inovador|innovative|diferente|unique)\b/gi.test(response)) {
      tags.push('innovative');
    }
    
    return [...new Set(tags)];
  }
  
  /**
   * Avalia originalidade da resposta
   */
  private evaluateOriginality(response: string): number {
    let score = 0.5;
    
    // Boost por uso de padrões criativos
    for (const pattern of CREATIVE_PATTERNS) {
      if (pattern.regex.test(response)) {
        score += 0.1;
      }
    }
    
    // Boost por variação de estrutura
    const sentences = response.split(/[.!?]+/).filter(s => s.trim());
    const avgLength = sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length;
    const variance = sentences.reduce((sum, s) => sum + Math.pow(s.length - avgLength, 2), 0) / sentences.length;
    if (variance > 500) score += 0.1; // Variação indica diversidade
    
    // Penalidade por clichês
    const cliches = [
      /é importante ressaltar/i,
      /em conclusão/i,
      /basicamente/i,
      /obviamente/i,
      /it goes without saying/i,
      /at the end of the day/i,
    ];
    for (const cliche of cliches) {
      if (cliche.test(response)) score -= 0.05;
    }
    
    return Math.max(0.1, Math.min(1, score));
  }
  
  /**
   * Avalia utilidade da resposta criativa
   */
  private evaluateUsefulness(response: string): number {
    let score = 0.5;
    
    // Boost por ações concretas
    if (/pode(mos)?|you can|tente|try|considere|consider/i.test(response)) {
      score += 0.15;
    }
    
    // Boost por exemplos
    if (/por exemplo|for example|como|such as|e\.g\./i.test(response)) {
      score += 0.15;
    }
    
    // Boost por estrutura
    if (/\d+\.|primeiro|segundo|first|second/i.test(response)) {
      score += 0.1;
    }
    
    // Penalidade por muito abstrato
    if (response.length > 1000 && !/```|por exemplo|example/i.test(response)) {
      score -= 0.1;
    }
    
    return Math.max(0.1, Math.min(1, score));
  }
  
  /**
   * Extrai padrões criativos usados
   */
  private extractPatterns(response: string): string[] {
    const patterns: string[] = [];
    
    for (const pattern of CREATIVE_PATTERNS) {
      if (pattern.regex.test(response)) {
        patterns.push(pattern.name);
      }
    }
    
    return patterns;
  }
}

// Singleton
export const BetaHemisphere = new BetaHemisphereService();
export default BetaHemisphere;
