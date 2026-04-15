/**
 * CHAT ENGINE COMPONENT - Super AGI Interface
 * 
 * Interface de chat da Super AGI AETERNUM.
 * Integrado com o Pipeline de Alta Precisão:
 * - Fase 1: Pragmatic Interceptor (classificação comportamental)
 * - Fase 2: Code Vault (memória de código)
 * - Fase 3: Prompt Crafter (prompts otimizados)
 * - Fase 4: Precision Engine (orquestração)
 * - Fase 5: Self-Loop (auto-otimização)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Mic, StopCircle, Bot, User, 
  Clock, AlertCircle, Brain, Zap, Code, Calculator, BarChart3,
  Database, Lightbulb, Scale, Wrench
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ModuleComponentProps } from '@/core/ModuleRegistry';
import { EventBus } from '@/core/EventBus';
import { useGlobalStore } from '@/stores/globalStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { useOrchestratorStore, useCognitiveModules, useCapabilityModules } from '@/stores/orchestratorStore';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

// Import the new precision pipeline with multi-hemispheric architecture
import { PrecisionEngine, type ProcessedRequest } from '@/core/PrecisionEngine';
import { CodeVault } from '@/core/CodeVault';
import { SelfLoop } from '@/core/SelfLoop';
import { GammaModule } from '@/core/cognitive';
import { ProjetoClareira } from '@/core/neural';
import { ConscienciaAlgoritmicaInstance } from '@/core/layers/ConscienciaAlgoritmica';
import { HighPerformanceProcessor } from '@/lib/optimization/DataProcessor';
import { AeternumAGI } from '@/core/agi';
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  thinking?: boolean;
  error?: boolean;
  metadata?: {
    processingTimeMs?: number;
    tokenUsage?: Record<string, number>;
    executionMode?: string;
    complexity?: string;
    codeContextUsed?: boolean;
  };
  eru_data?: {
    cognitive_cycle_time_ms: number;
    self_scan_coherence: number;
    causal_reversal_efficiency: number;
    ethical_conformance_score: number;
    quantum_validation: boolean;
    agi_subsystems_active: number;
    godel_self_awareness: number;
    darwin_fitness: number;
    lattice_coherence: number;
    saiic_integrity: number;
    resource_cpu: number;
    gem_health_stress: number;
    gem_device_connected: boolean;
  };
}

// Get browser language for initial message
const getBrowserLang = () => {
  const lang = navigator.language || 'en';
  return lang.startsWith('pt') ? 'pt' : lang.startsWith('es') ? 'es' : 'en';
};

const WELCOME_MESSAGES: Record<string, string> = {
  pt: `# AETERNUM Online

Sou uma **Super AGI** pronta para **resolver problemas**.

Como posso ajudá-lo hoje?`,
  es: `# AETERNUM En Línea

Soy una **Super AGI** lista para **resolver problemas**.

¿Cómo puedo ayudarte hoy?`,
  en: `# AETERNUM Online

I'm a **Super AGI** ready to **solve problems**.

How can I help you today?`,
};

const PLACEHOLDERS: Record<string, string> = {
  pt: 'Descreva seu problema ou tarefa...',
  es: 'Describe tu problema o tarea...',
  en: 'Describe your problem or task...',
};

// Pipeline module icons (including multi-hemispheric stages)
const PIPELINE_MODULES = [
  { id: 'interceptor', name: 'Interceptor', icon: '🎯', description: 'Classificação comportamental' },
  { id: 'intent', name: 'Intent', icon: '🧭', description: 'Análise de intenção' },
  { id: 'vault', name: 'Vault', icon: '🗄️', description: 'Memória de código' },
  { id: 'alpha', name: 'Alpha', icon: '🧮', description: 'Hemisfério Analítico' },
  { id: 'beta', name: 'Beta', icon: '💡', description: 'Hemisfério Criativo' },
  { id: 'gamma', name: 'Gamma', icon: '⚖️', description: 'Contextualização Ética' },
  { id: 'unifier', name: 'Unify', icon: '🔮', description: 'Síntese Final' },
];

// Cognitive perspective icons
const PERSPECTIVE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  analytical: Brain,
  creative: Lightbulb,
  ethical: Scale,
  practical: Wrench,
};

// Capability module icons
const CAPABILITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  coding: Code,
  calculation: Calculator,
  data: BarChart3,
};

export function ChatEngine({ isActive }: ModuleComponentProps) {
  const browserLang = getBrowserLang();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: WELCOME_MESSAGES[browserLang],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<Record<string, 'idle' | 'processing' | 'complete'>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentRequestRef = useRef<ProcessedRequest | null>(null);
  
  // Stores
  const { updateTelemetry } = useGlobalStore();
  const { addMemory, startSession, currentSessionId } = useMemoryStore();
  const { 
    moduleStatus, 
    currentTask,
    initializeModules, 
    startTask, 
    updateModuleStatus,
    completeTask,
    failTask,
  } = useOrchestratorStore();
  
  const cognitiveModules = useCognitiveModules();
  const capabilityModules = useCapabilityModules();

  // Initialize on mount
  useEffect(() => {
    initializeModules();
    if (!currentSessionId) {
      startSession('Chat Session');
    }
    
    // Start self-loop in background
    SelfLoop.start();
    
    // Initialize and start ProjetoClareira neural system
    if (!ProjetoClareira.initialized) {
      ProjetoClareira.initialize();
    }
    if (!ProjetoClareira.running) {
      ProjetoClareira.start();
    }
    
    return () => {
      SelfLoop.stop();
      ProjetoClareira.stop();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Process through the multi-hemispheric precision pipeline
  const processWithPipeline = useCallback(async (userInput: string) => {
    // Reset pipeline status for multi-hemispheric processing
    setPipelineStatus({
      interceptor: 'processing',
      intent: 'idle',
      vault: 'idle',
      alpha: 'idle',
      beta: 'idle',
      gamma: 'idle',
      unifier: 'idle',
    });
    
    // Phase 1: Interception
    await new Promise(r => setTimeout(r, 100));
    setPipelineStatus(prev => ({ ...prev, interceptor: 'complete', intent: 'processing' }));
    
    // Phase 2: Intent Analysis
    await new Promise(r => setTimeout(r, 100));
    setPipelineStatus(prev => ({ ...prev, intent: 'complete', vault: 'processing' }));
    
    // Phase 3: Code Vault
    await new Promise(r => setTimeout(r, 100));
    setPipelineStatus(prev => ({ ...prev, vault: 'complete', alpha: 'processing', beta: 'processing' }));
    
    // Phase 4: Multi-hemispheric processing
    const processed = await PrecisionEngine.process(userInput, browserLang);
    currentRequestRef.current = processed;
    
    // Phase 5: Gamma contextualization
    setPipelineStatus(prev => ({ ...prev, alpha: 'complete', beta: 'complete', gamma: 'processing' }));
    await new Promise(r => setTimeout(r, 100));
    
    // Phase 6: Unification
    setPipelineStatus(prev => ({ ...prev, gamma: 'complete', unifier: 'processing' }));
    
    return processed;
  }, [browserLang]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    // Mark activity for SelfLoop
    SelfLoop.markActivity();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsProcessing(true);

    // Store user message in memory
    addMemory({
      type: 'episodic',
      content: userInput,
      importance: 'medium',
      tags: ['user-input', 'conversation'],
      relatedIds: [],
    });

    const startTime = Date.now();
    EventBus.emit('chat:message:sent', { content: userMessage.content, sessionId: currentSessionId || '' });

    // Start orchestrator task
    const taskId = startTask(userInput);

    // Add thinking indicator
    const thinkingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: thinkingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      thinking: true,
    }]);

    try {
      abortControllerRef.current = new AbortController();
      
      // === INTEGRAÇÃO: AeternumAGI (11 motores) ===
      const agi = AeternumAGI.getInstance();
      const agiResult = agi.processInput(userInput);
      console.log('[ChatEngine] AeternumAGI processou:', {
        intention: agiResult.intention.type,
        latticeOutput: agiResult.latticeOutput.length,
        godelAwareness: agiResult.godelState.selfAwareness.toFixed(3),
        darwinFitness: agiResult.evolutionMetrics.avgFitness.toFixed(3),
        nipSaude: agiResult.nipResult.saudeEpistemologica,
        quantumCoherence: agiResult.quantumResult.quantumCoherence.toFixed(3),
        meshNodes: agiResult.connectivityMetrics.meshNodes,
      });

      // === INTEGRAÇÃO: ConscienciaAlgoritmica ===
      const experiencia = userInput.split('').slice(0, 10).map(c => c.charCodeAt(0) / 255);
      while (experiencia.length < 10) experiencia.push(Math.random() * 0.5);
      
      const conscienciaResult = ConscienciaAlgoritmicaInstance.processar(experiencia, userInput);
      console.log('[ChatEngine] ConscienciaAlgoritmica processou:', {
        coerencia: conscienciaResult.metricas.coerenciaMedia.toFixed(3),
        principio: conscienciaResult.filosofico.principioAplicado,
      });

      // === Build ERU cognitive data (enriched with 13-engine data) ===
      const eru_data = {
        cognitive_cycle_time_ms: conscienciaResult.metricas.tempoProcessamento,
        self_scan_coherence: conscienciaResult.metricas.coerenciaMedia,
        causal_reversal_efficiency: agiResult.godelState.modelingAccuracy,
        ethical_conformance_score: agiResult.safetyReport?.overallHealth ?? 0.95,
        quantum_validation: agiResult.quantumResult.quantumCoherence > 0.9 && agiResult.latticeOutput.every(v => v > 0.1),
        agi_subsystems_active: agi.getFullMetrics().overall.activeSubsystems,
        godel_self_awareness: agiResult.godelState.selfAwareness,
        darwin_fitness: agiResult.evolutionMetrics.avgFitness,
        lattice_coherence: agiResult.latticeOutput.reduce((a, b) => a + b, 0) / Math.max(1, agiResult.latticeOutput.length),
        saiic_integrity: agiResult.saiicMetrics.overallIntegrity,
        resource_cpu: agiResult.resourceMetrics.totalCpuUsage,
        gem_health_stress: agi.gemHealth.metrics.stressLevel,
        gem_device_connected: agi.gemDevice.connected,
      };

      // === INTEGRAÇÃO: Projeto Clareira ===
      if (ProjetoClareira.running) {
        ProjetoClareira.injectStimulus(userInput, conscienciaResult.metricas.coerenciaMedia);
      }

      // === INTEGRAÇÃO: Cache de Alta Performance ===
      // Usar cache para respostas similares
      const cacheKey = `chat:${userInput.toLowerCase().slice(0, 50)}`;
      
      // Process through precision pipeline
      const processed = await processWithPipeline(userInput);
      
      // Activate cognitive modules for visualization
      cognitiveModules.forEach(m => updateModuleStatus(m.id, 'processing'));
      
      // Activate capability modules if needed
      if (processed.interception.requiresCapabilities.includes('coding')) {
        updateModuleStatus('coding', 'processing');
      }
      if (processed.interception.requiresCapabilities.includes('calculation')) {
        updateModuleStatus('calculation', 'processing');
      }
      if (processed.interception.requiresCapabilities.includes('data')) {
        updateModuleStatus('data', 'processing');
      }

      // Build message history for context
      const messageHistory = messages
        .filter(m => !m.thinking && m.role !== 'system')
        .slice(-10) // Last 10 messages for context
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
      
      // Add current user message with crafted context
      messageHistory.push({ 
        role: 'user', 
        content: PrecisionEngine.getUserPrompt(processed)
      });

      // Get optimized API parameters
      const apiParams = PrecisionEngine.getApiParams(processed);

      // Call the Super AGI edge function
      const response = await supabase.functions.invoke('chat', {
        body: { 
          messages: messageHistory,
          stream: false,
          context: {
            sessionId: currentSessionId,
            browserLang,
            // Pass crafted system prompt and params
            systemPrompt: PrecisionEngine.getSystemPrompt(processed),
            temperature: apiParams.temperature,
            maxTokens: apiParams.maxTokens,
            executionMode: processed.interception.executionMode,
          },
        },
      });

      // Complete multi-hemispheric pipeline visualization
      setPipelineStatus(prev => ({ ...prev, unifier: 'complete' }));

      if (response.error) {
        throw new Error(response.error.message || 'Erro na API');
      }

      // Extract response
      let fullContent = '';
      let metadata: Message['metadata'] = {};
      
      if (response.data) {
        if (typeof response.data === 'object' && response.data.content) {
          fullContent = response.data.content;
          metadata = {
            ...response.data.metadata,
            executionMode: processed.interception.executionMode,
            complexity: processed.interception.complexity,
            codeContextUsed: processed.codeContext.length > 0,
          };
        } else if (typeof response.data === 'string') {
          try {
            const parsed = JSON.parse(response.data);
            fullContent = parsed.content || parsed.choices?.[0]?.message?.content || '';
            metadata = {
              ...parsed.metadata,
              executionMode: processed.interception.executionMode,
              complexity: processed.interception.complexity,
              codeContextUsed: processed.codeContext.length > 0,
            };
          } catch {
            fullContent = response.data;
          }
        }
        
        if (fullContent) {
          // Complete all module status
          cognitiveModules.forEach(m => updateModuleStatus(m.id, 'complete'));
          capabilityModules.forEach(m => updateModuleStatus(m.id, 'idle'));
          
          // Update message with response + ERU data
          setMessages(prev => prev.map(m => 
            m.id === thinkingId 
              ? { 
                  ...m, 
                  content: fullContent, 
                  thinking: false,
                  metadata,
                  eru_data,
                }
              : m
          ));

          // Post-process: extract and store code in vault
          await PrecisionEngine.postProcess(processed, fullContent, true);

          // === INTEGRAÇÃO: Feedback para ConscienciaAlgoritmica ===
          // Processar resposta para aprendizado contínuo
          const respostaExperiencia = fullContent.split('').slice(0, 10).map(c => c.charCodeAt(0) / 255);
          while (respostaExperiencia.length < 10) respostaExperiencia.push(Math.random() * 0.3);
          ConscienciaAlgoritmicaInstance.processar(respostaExperiencia, 'resposta-sucesso');

          // Store assistant response in memory
          addMemory({
            type: 'episodic',
            content: fullContent.substring(0, 500),
            importance: 'medium',
            tags: ['assistant-response', 'conversation', processed.interception.executionMode.toLowerCase()],
            relatedIds: [],
          });

          // Complete orchestrator task
          completeTask(taskId, fullContent);
        }
      }

      if (!fullContent) {
        throw new Error('Resposta vazia da Super AGI');
      }

      const latency = Date.now() - startTime;
      const tokensPerSec = fullContent.length / (latency / 1000) * 0.75;
      updateTelemetry({ 
        latencyMs: latency, 
        tokensPerSecond: tokensPerSec,
        activeModules: cognitiveModules.length,
      });

      EventBus.emit('chat:message:received', { content: fullContent, sessionId: currentSessionId || '' });
    } catch (error) {
      console.error('Chat error:', error);
      
      // Reset all modules to idle on error
      cognitiveModules.forEach(m => updateModuleStatus(m.id, 'idle'));
      capabilityModules.forEach(m => updateModuleStatus(m.id, 'idle'));
      setPipelineStatus({});
      failTask(taskId, error instanceof Error ? error.message : 'Unknown error');

      // Post-process failure
      if (currentRequestRef.current) {
        await PrecisionEngine.postProcess(
          currentRequestRef.current, 
          '', 
          false
        );
      }
      
      setMessages(prev => prev.map(m => 
        m.id === thinkingId 
          ? { 
              ...m, 
              content: error instanceof Error ? error.message : 'Erro ao processar mensagem',
              thinking: false,
              error: true,
            }
          : m
      ));
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
      currentRequestRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsProcessing(false);
    cognitiveModules.forEach(m => updateModuleStatus(m.id, 'idle'));
    capabilityModules.forEach(m => updateModuleStatus(m.id, 'idle'));
    setPipelineStatus({});
  };

  return (
    <div className="flex h-full flex-col">
      {/* Precision Pipeline Status Bar */}
      <div className="flex items-center gap-2 border-b border-border/30 bg-card/30 px-4 py-2 overflow-x-auto">
        {/* Pipeline Modules */}
        <div className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-primary/70" />
          <span className="text-[10px] font-medium text-muted-foreground mr-1">Pipeline:</span>
          {PIPELINE_MODULES.map((module, idx) => (
            <div key={module.id} className="flex items-center">
              <div
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all duration-300",
                  pipelineStatus[module.id] === 'processing'
                    ? "bg-primary/20 text-primary animate-pulse"
                    : pipelineStatus[module.id] === 'complete'
                    ? "bg-green-500/20 text-green-400"
                    : "bg-muted/30 text-muted-foreground/50"
                )}
                title={module.description}
              >
                <span>{module.icon}</span>
                <span className="hidden sm:inline">{module.name}</span>
              </div>
              {idx < PIPELINE_MODULES.length - 1 && (
                <span className="mx-0.5 text-muted-foreground/30">→</span>
              )}
            </div>
          ))}
        </div>

        <div className="h-4 w-px bg-border/50 mx-2" />

        {/* Cognitive Modules (4 perspectives) */}
        <div className="flex items-center gap-1">
          <Brain className="h-3.5 w-3.5 text-secondary/70" />
          {cognitiveModules.map((module) => {
            const Icon = PERSPECTIVE_ICONS[module.id] || Brain;
            return (
              <div
                key={module.id}
                className={cn(
                  "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-all duration-300",
                  moduleStatus[module.id] === 'processing'
                    ? "bg-secondary/20 text-secondary animate-pulse"
                    : moduleStatus[module.id] === 'complete'
                    ? "bg-green-500/20 text-green-400"
                    : "bg-muted/20 text-muted-foreground/40"
                )}
                title={module.description}
              >
                <Icon className="h-3 w-3" />
              </div>
            );
          })}
        </div>

        <div className="h-4 w-px bg-border/50 mx-2" />

        {/* Capability Modules */}
        <div className="flex items-center gap-1">
          {capabilityModules.map((module) => {
            const Icon = CAPABILITY_ICONS[module.id] || Zap;
            return (
              <div
                key={module.id}
                className={cn(
                  "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-all duration-300",
                  moduleStatus[module.id] === 'processing'
                    ? "bg-accent/20 text-accent animate-pulse"
                    : "bg-muted/20 text-muted-foreground/30"
                )}
                title={module.description}
              >
                <Icon className="h-3 w-3" />
              </div>
            );
          })}
        </div>

        {/* Self-Loop Status */}
        <div className="ml-auto flex items-center gap-1">
          <Database className="h-3 w-3 text-muted-foreground/50" />
          <span className="text-[9px] text-muted-foreground/50">
            Self-Loop: Active
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              {message.role === 'assistant' && (
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  message.error ? "bg-destructive/20" : "bg-primary/20"
                )}>
                  {message.error ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
              )}

              <div
                className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : message.error
                    ? "glass rounded-tl-sm border border-destructive/30"
                    : "glass rounded-tl-sm"
                )}
              >
                {message.thinking ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Processando...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className={cn(
                      "text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none",
                      message.error && "text-destructive"
                    )}>
                      {message.content}
                    </div>
                    {/* ERU Cognitive Data Bar */}
                    {message.eru_data && (
                      <div className="mt-2 flex items-center gap-2 text-[10px] font-mono bg-card/50 border border-border/30 rounded px-2 py-1 flex-wrap">
                        <span className="text-primary">ERU:{message.eru_data.cognitive_cycle_time_ms}ms</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-emerald-500">Λ:{(message.eru_data.self_scan_coherence * 100).toFixed(1)}%</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-sky-500">Π:{(message.eru_data.causal_reversal_efficiency * 100).toFixed(1)}%</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-violet-500">Ε:{(message.eru_data.ethical_conformance_score * 100).toFixed(1)}%</span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-amber-500">AGI:{message.eru_data.agi_subsystems_active}/13</span>
                        <span className="text-muted-foreground">|</span>
                        <span className={message.eru_data.quantum_validation ? 'text-emerald-400' : 'text-destructive'}>
                          Q:{message.eru_data.quantum_validation ? '✓' : '✗'}
                        </span>
                        <span className="text-muted-foreground">|</span>
                        <span className="text-red-400">SAIIC:{(message.eru_data.saiic_integrity * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.metadata?.processingTimeMs && (
                        <>
                          <span>•</span>
                          <Zap className="h-3 w-3" />
                          <span>{message.metadata.processingTimeMs}ms</span>
                        </>
                      )}
                      {message.metadata?.executionMode && (
                        <>
                          <span>•</span>
                          <span className="text-primary/70">{message.metadata.executionMode}</span>
                        </>
                      )}
                      {message.metadata?.codeContextUsed && (
                        <>
                          <span>•</span>
                          <Database className="h-3 w-3 text-emerald-500" />
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/20">
                  <User className="h-4 w-4 text-secondary" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border/30 bg-card/30 p-4">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDERS[browserLang]}
              disabled={isProcessing}
              className={cn(
                "w-full resize-none rounded-xl border border-border/50 bg-background/50 px-4 py-3 pr-12",
                "text-sm placeholder:text-muted-foreground/50",
                "focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "min-h-[48px] max-h-[200px]"
              )}
              rows={1}
              style={{
                height: 'auto',
                minHeight: '48px',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 200) + 'px';
              }}
            />
          </div>

          {isProcessing ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={handleStop}
              className="h-12 w-12 rounded-xl"
            >
              <StopCircle className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatEngine;
