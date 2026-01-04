/**
 * FASE 4: PRECISION ENGINE (MULTI-HEMISPHERIC)
 * 
 * Motor de Alta Precisão - Orquestrador principal com arquitetura multi-hemisférica.
 * 
 * Pipeline Completo:
 * 1. Intercepta → PragmaticInterceptor
 * 2. Analisa Intenção → IntentAnalyzer
 * 3. Busca contexto → CodeVault.findSimilarCode()
 * 4. Processamento Paralelo:
 *    a. Alpha Hemisphere (analítico/lógico)
 *    b. Beta Hemisphere (criativo/intuitivo)
 * 5. Contextualização → GammaModule (ético/prático)
 * 6. Unificação → UnifiedResponseGenerator
 * 7. Crafta prompt → PromptCrafter.build()
 * 8. Valida e armazena → CodeVault (se sucesso)
 * 
 * Este é o coração da Super AGI - coordena todos os módulos para máxima precisão.
 */

import { PragmaticInterceptor, type InterceptionResult } from './PragmaticInterceptor';
import { CodeVault, type SearchResult, type CodeSnippet } from './CodeVault';
import { PromptCrafter, type CraftedPrompt } from './PromptCrafter';
import { EventBus } from './EventBus';

// Import cognitive modules
import {
  IntentAnalyzer,
  AlphaHemisphere,
  BetaHemisphere,
  GammaModule,
  UnifiedResponseGenerator,
  type IntentProfile,
  type HemisphereOutput,
  type GammaContextualOutput,
} from './cognitive';

// Interface para a requisição processada
export interface ProcessedRequest {
  id: string;
  originalInput: string;
  interception: InterceptionResult;
  intent: IntentProfile;
  codeContext: SearchResult[];
  craftedPrompt: CraftedPrompt;
  hemisphericProcessing: {
    alpha: { systemPrompt: string; temperature: number };
    beta: { systemPrompt: string; temperature: number };
    gammaContext?: GammaContextualOutput;
    unificationPrompt?: string;
  };
  processedAt: number;
}

// Interface para o resultado do processamento
export interface ProcessingResult {
  request: ProcessedRequest;
  response: string;
  success: boolean;
  extractedCode: ExtractedCode[];
  processingTimeMs: number;
  metadata: {
    codeContextUsed: boolean;
    snippetsStored: number;
    temperature: number;
    maxTokens: number;
  };
}

// Interface para código extraído da resposta
export interface ExtractedCode {
  code: string;
  language: string;
  description: string;
  startIndex: number;
  endIndex: number;
}

/**
 * PrecisionEngine - Motor de Processamento de Alta Precisão (Multi-Hemisférico)
 */
class PrecisionEngineService {
  private requestCounter = 0;
  private processingHistory: ProcessingResult[] = [];
  
  /**
   * Processa uma entrada do usuário através do pipeline multi-hemisférico completo
   */
  async process(
    input: string,
    browserLang: string = 'pt'
  ): Promise<ProcessedRequest> {
    const id = `req_${++this.requestCounter}_${Date.now()}`;
    const startTime = Date.now();
    
    console.log(`[PrecisionEngine] Processing request ${id} (Multi-Hemispheric)`);
    
    // FASE 1: Interceptação Comportamental
    EventBus.emit('orchestrator:persona:start', { taskId: id, persona: 'interceptor' });
    const interception = PragmaticInterceptor.intercept(input, browserLang);
    EventBus.emit('orchestrator:persona:end', { 
      taskId: id, 
      persona: 'interceptor', 
      result: interception 
    });
    
    console.log(`[PrecisionEngine] Interception result:`, {
      mode: interception.executionMode,
      responseType: interception.responseType,
      complexity: interception.complexity,
    });
    
    // FASE 2: Análise de Intenção (Multi-Hemisférica)
    EventBus.emit('orchestrator:persona:start', { taskId: id, persona: 'intent-analyzer' });
    const intent = IntentAnalyzer.analyze(input);
    EventBus.emit('orchestrator:persona:end', { 
      taskId: id, 
      persona: 'intent-analyzer', 
      result: intent 
    });
    
    console.log(`[PrecisionEngine] Intent analysis:`, {
      primary: intent.primary,
      weights: intent.weights,
      complexity: intent.metadata.complexity,
    });
    
    // FASE 3: Busca de contexto no Code Vault
    let codeContext: SearchResult[] = [];
    
    if (interception.requiresCapabilities.includes('coding') || intent.metadata.requiresCode) {
      EventBus.emit('orchestrator:persona:start', { taskId: id, persona: 'code-vault' });
      
      try {
        codeContext = await CodeVault.findSimilarCode(input, {
          maxResults: 3,
          minRelevance: 0.3,
        });
        
        console.log(`[PrecisionEngine] Found ${codeContext.length} similar code snippets`);
      } catch (error) {
        console.warn('[PrecisionEngine] Code vault search failed:', error);
      }
      
      EventBus.emit('orchestrator:persona:end', { 
        taskId: id, 
        persona: 'code-vault', 
        result: { count: codeContext.length } 
      });
    }
    
    // FASE 4: Processamento Multi-Hemisférico (Preparação)
    EventBus.emit('orchestrator:persona:start', { taskId: id, persona: 'alpha-hemisphere' });
    const alphaConfig = AlphaHemisphere.process(input, intent);
    EventBus.emit('orchestrator:persona:end', { 
      taskId: id, 
      persona: 'alpha-hemisphere', 
      result: { temperature: alphaConfig.temperature } 
    });
    
    EventBus.emit('orchestrator:persona:start', { taskId: id, persona: 'beta-hemisphere' });
    const betaConfig = BetaHemisphere.process(input, intent);
    EventBus.emit('orchestrator:persona:end', { 
      taskId: id, 
      persona: 'beta-hemisphere', 
      result: { temperature: betaConfig.temperature } 
    });
    
    console.log(`[PrecisionEngine] Hemispheric processing configured:`, {
      alpha: { temp: alphaConfig.temperature, tags: alphaConfig.expectedTags },
      beta: { temp: betaConfig.temperature, tags: betaConfig.expectedTags },
    });
    
    // FASE 5: Construção do prompt otimizado (com contexto hemisférico)
    EventBus.emit('orchestrator:persona:start', { taskId: id, persona: 'prompt-crafter' });
    const craftedPrompt = PromptCrafter.build(interception, codeContext, browserLang);
    
    // Enriquecer o system prompt com diretrizes hemisféricas
    const enhancedSystemPrompt = this.enhanceWithHemisphericContext(
      craftedPrompt.systemPrompt,
      intent,
      alphaConfig,
      betaConfig
    );
    
    const enhancedCraftedPrompt: CraftedPrompt = {
      ...craftedPrompt,
      systemPrompt: enhancedSystemPrompt,
      // Ajustar temperatura baseado no perfil dominante
      temperature: this.calculateOptimalTemperature(intent, alphaConfig, betaConfig),
    };
    
    EventBus.emit('orchestrator:persona:end', { 
      taskId: id, 
      persona: 'prompt-crafter', 
      result: { temperature: enhancedCraftedPrompt.temperature, maxTokens: enhancedCraftedPrompt.maxTokens } 
    });
    
    console.log(`[PrecisionEngine] Enhanced prompt crafted:`, {
      temperature: enhancedCraftedPrompt.temperature,
      maxTokens: enhancedCraftedPrompt.maxTokens,
      hasContext: codeContext.length > 0,
      intentProfile: intent.primary,
    });
    
    const processedAt = Date.now();
    
    return {
      id,
      originalInput: input,
      interception,
      intent,
      codeContext,
      craftedPrompt: enhancedCraftedPrompt,
      hemisphericProcessing: {
        alpha: { systemPrompt: alphaConfig.systemPrompt, temperature: alphaConfig.temperature },
        beta: { systemPrompt: betaConfig.systemPrompt, temperature: betaConfig.temperature },
      },
      processedAt,
    };
  }
  
  /**
   * Enriquece o system prompt com contexto hemisférico
   */
  private enhanceWithHemisphericContext(
    basePrompt: string,
    intent: IntentProfile,
    alphaConfig: { systemPrompt: string; temperature: number; expectedTags: string[] },
    betaConfig: { systemPrompt: string; temperature: number; expectedTags: string[] }
  ): string {
    const hemisphericGuidance = `
## ARQUITETURA COGNITIVA MULTI-HEMISFÉRICA

Perfil de Intenção Detectado: ${intent.primary.toUpperCase()}
- Peso Analítico: ${(intent.weights.analytical * 100).toFixed(0)}%
- Peso Criativo: ${(intent.weights.creative * 100).toFixed(0)}%
- Peso Prático: ${(intent.weights.practical * 100).toFixed(0)}%

### DIRETRIZ DE SÍNTESE
${intent.primary === 'analytical' 
  ? 'PRIORIZE: Raciocínio estruturado, dados, código preciso. SECUNDÁRIO: Insights criativos.'
  : intent.primary === 'creative'
  ? 'PRIORIZE: Perspectivas inovadoras, metáforas, visão. SECUNDÁRIO: Fundamentação técnica.'
  : intent.primary === 'practical'
  ? 'PRIORIZE: Passos acionáveis, implementação, viabilidade. SECUNDÁRIO: Contexto analítico.'
  : 'EQUILIBRE: Análise + Criatividade + Praticidade em proporções iguais.'}

### TAGS ESPERADAS
- Analíticas: ${alphaConfig.expectedTags.join(', ')}
- Criativas: ${betaConfig.expectedTags.join(', ')}

`;

    return hemisphericGuidance + basePrompt;
  }
  
  /**
   * Calcula temperatura ótima baseada no perfil de intenção
   */
  private calculateOptimalTemperature(
    intent: IntentProfile,
    alphaConfig: { temperature: number },
    betaConfig: { temperature: number }
  ): number {
    // Weighted average based on intent profile
    const weightedTemp = 
      (alphaConfig.temperature * intent.weights.analytical) +
      (betaConfig.temperature * intent.weights.creative) +
      (0.6 * intent.weights.practical); // Practical gets balanced temp
    
    return Math.max(0.1, Math.min(0.95, weightedTemp));
  }
  
  /**
   * Pós-processa a resposta da IA
   */
  async postProcess(
    request: ProcessedRequest,
    response: string,
    success: boolean = true
  ): Promise<ProcessingResult> {
    const startTime = request.processedAt;
    const processingTimeMs = Date.now() - startTime;
    
    // Extrair código da resposta
    const extractedCode = this.extractCodeBlocks(response);
    
    console.log(`[PrecisionEngine] Extracted ${extractedCode.length} code blocks from response`);
    
    // FASE 5: Armazenar código bem-sucedido no Code Vault
    let snippetsStored = 0;
    
    if (success && extractedCode.length > 0) {
      for (const code of extractedCode) {
        try {
          // Gerar descrição a partir do contexto
          const description = this.generateCodeDescription(
            request.originalInput,
            code.code,
            code.language
          );
          
          // Extrair tags
          const tags = this.extractTags(request.originalInput, code.code, code.language);
          
          // Armazenar no vault
          await CodeVault.storeCodeSnippet(
            code.code,
            code.language,
            description,
            tags,
            {
              category: this.detectCodeCategory(code.code, code.language),
              validated: false,
              metadata: {
                framework: this.detectFramework(code.code),
                complexity: request.interception.complexity as 'low' | 'medium' | 'high',
              },
            }
          );
          
          snippetsStored++;
        } catch (error) {
          console.warn('[PrecisionEngine] Failed to store code snippet:', error);
        }
      }
      
      console.log(`[PrecisionEngine] Stored ${snippetsStored} code snippets in vault`);
    }
    
    const result: ProcessingResult = {
      request,
      response,
      success,
      extractedCode,
      processingTimeMs,
      metadata: {
        codeContextUsed: request.codeContext.length > 0,
        snippetsStored,
        temperature: request.craftedPrompt.temperature,
        maxTokens: request.craftedPrompt.maxTokens,
      },
    };
    
    // Armazenar no histórico
    this.processingHistory.push(result);
    if (this.processingHistory.length > 100) {
      this.processingHistory.shift();
    }
    
    // Emitir evento de conclusão
    EventBus.emit('orchestrator:complete', { 
      taskId: request.id, 
      result: {
        success,
        extractedCode: extractedCode.length,
        snippetsStored,
        processingTimeMs,
      }
    });
    
    return result;
  }
  
  /**
   * Extrai blocos de código da resposta
   */
  private extractCodeBlocks(text: string): ExtractedCode[] {
    const codeBlocks: ExtractedCode[] = [];
    
    // Regex para blocos de código markdown
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      
      // Ignorar blocos vazios ou muito curtos
      if (code.length < 20) continue;
      
      codeBlocks.push({
        code,
        language: this.normalizeLanguage(language),
        description: '',
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
    
    return codeBlocks;
  }
  
  /**
   * Normaliza nome da linguagem
   */
  private normalizeLanguage(lang: string): string {
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'ts': 'typescript',
      'jsx': 'javascript',
      'tsx': 'typescript',
      'py': 'python',
      'rb': 'ruby',
      'sh': 'bash',
      'yml': 'yaml',
      'md': 'markdown',
    };
    
    return langMap[lang.toLowerCase()] || lang.toLowerCase();
  }
  
  /**
   * Gera descrição para o código
   */
  private generateCodeDescription(input: string, code: string, language: string): string {
    // Usar primeira linha do input como base
    const inputSummary = input.slice(0, 100).replace(/\n/g, ' ').trim();
    
    // Tentar extrair nome de função/classe
    let identifier = '';
    
    if (['javascript', 'typescript'].includes(language)) {
      const funcMatch = code.match(/(?:function|const|let|var|export)\s+(\w+)/);
      if (funcMatch) identifier = funcMatch[1];
    } else if (language === 'python') {
      const funcMatch = code.match(/(?:def|class)\s+(\w+)/);
      if (funcMatch) identifier = funcMatch[1];
    }
    
    if (identifier) {
      return `${identifier}: ${inputSummary}`;
    }
    
    return inputSummary;
  }
  
  /**
   * Extrai tags do código e contexto
   */
  private extractTags(input: string, code: string, language: string): string[] {
    const tags: string[] = [language];
    
    // Palavras-chave comuns
    const techTerms = [
      'react', 'component', 'hook', 'state', 'effect', 'context',
      'api', 'fetch', 'async', 'promise', 'axios',
      'database', 'sql', 'query', 'crud',
      'auth', 'login', 'token', 'jwt',
      'test', 'mock', 'jest',
      'algorithm', 'sort', 'search', 'filter',
      'validation', 'form', 'input',
      'animation', 'css', 'style',
      'util', 'helper', 'function',
    ];
    
    const combinedText = `${input} ${code}`.toLowerCase();
    
    for (const term of techTerms) {
      if (combinedText.includes(term)) {
        tags.push(term);
      }
    }
    
    return [...new Set(tags)].slice(0, 10);
  }
  
  /**
   * Detecta categoria do código
   */
  private detectCodeCategory(code: string, language: string): CodeSnippet['category'] {
    const lowerCode = code.toLowerCase();
    
    if (lowerCode.includes('function') || lowerCode.includes('const ') || lowerCode.includes('def ')) {
      if (lowerCode.includes('export') || lowerCode.includes('module')) {
        return 'utility';
      }
      return 'function';
    }
    
    if (lowerCode.includes('class ') || lowerCode.includes('interface ') || lowerCode.includes('type ')) {
      if (lowerCode.includes('component') || lowerCode.includes('react')) {
        return 'component';
      }
      return 'pattern';
    }
    
    if (lowerCode.includes('algorithm') || lowerCode.includes('sort') || lowerCode.includes('search')) {
      return 'algorithm';
    }
    
    if (['json', 'yaml', 'toml', 'env'].includes(language)) {
      return 'config';
    }
    
    return 'other';
  }
  
  /**
   * Detecta framework usado no código
   */
  private detectFramework(code: string): string | undefined {
    const lowerCode = code.toLowerCase();
    
    if (lowerCode.includes('react') || lowerCode.includes('usestate') || lowerCode.includes('useeffect')) {
      return 'react';
    }
    if (lowerCode.includes('vue') || lowerCode.includes('definecomponent')) {
      return 'vue';
    }
    if (lowerCode.includes('angular') || lowerCode.includes('@component')) {
      return 'angular';
    }
    if (lowerCode.includes('express') || lowerCode.includes('app.get(') || lowerCode.includes('app.post(')) {
      return 'express';
    }
    if (lowerCode.includes('django') || lowerCode.includes('from django')) {
      return 'django';
    }
    if (lowerCode.includes('flask') || lowerCode.includes('from flask')) {
      return 'flask';
    }
    
    return undefined;
  }
  
  /**
   * Obtém o prompt de sistema completo para usar na API
   */
  getSystemPrompt(request: ProcessedRequest): string {
    return request.craftedPrompt.systemPrompt;
  }
  
  /**
   * Obtém o prompt do usuário com contexto injetado
   */
  getUserPrompt(request: ProcessedRequest): string {
    return request.craftedPrompt.userPrompt;
  }
  
  /**
   * Obtém parâmetros de API otimizados
   */
  getApiParams(request: ProcessedRequest): { temperature: number; maxTokens: number } {
    return {
      temperature: request.craftedPrompt.temperature,
      maxTokens: request.craftedPrompt.maxTokens,
    };
  }
  
  /**
   * Obtém histórico de processamento
   */
  getHistory(): ProcessingResult[] {
    return [...this.processingHistory];
  }
  
  /**
   * Obtém estatísticas de processamento
   */
  getStats(): {
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    codeContextHitRate: number;
    totalSnippetsStored: number;
  } {
    const total = this.processingHistory.length;
    if (total === 0) {
      return {
        totalProcessed: 0,
        successRate: 0,
        averageProcessingTime: 0,
        codeContextHitRate: 0,
        totalSnippetsStored: 0,
      };
    }
    
    const successes = this.processingHistory.filter(r => r.success).length;
    const contextHits = this.processingHistory.filter(r => r.metadata.codeContextUsed).length;
    const totalTime = this.processingHistory.reduce((sum, r) => sum + r.processingTimeMs, 0);
    const totalSnippets = this.processingHistory.reduce((sum, r) => sum + r.metadata.snippetsStored, 0);
    
    return {
      totalProcessed: total,
      successRate: successes / total,
      averageProcessingTime: totalTime / total,
      codeContextHitRate: contextHits / total,
      totalSnippetsStored: totalSnippets,
    };
  }
}

// Singleton
export const PrecisionEngine = new PrecisionEngineService();

export default PrecisionEngine;
