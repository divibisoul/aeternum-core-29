/**
 * CHAT ENGINE COMPONENT - Super AGI Interface
 * 
 * Interface de chat da Super AGI AETERNUM.
 * Integrado com:
 * - Orquestrador Map-Reduce (4 perspectivas paralelas)
 * - Sistema de Memória LTM
 * - Telemetria Cognitiva
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, Mic, StopCircle, Sparkles, Bot, User, 
  Clock, AlertCircle, Brain, Zap, Database, Code, Calculator, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ModuleComponentProps } from '@/core/ModuleRegistry';
import { EventBus } from '@/core/EventBus';
import { useGlobalStore } from '@/stores/globalStore';
import { useMemoryStore } from '@/stores/memoryStore';
import { useOrchestratorStore, useCognitiveModules, useCapabilityModules } from '@/stores/orchestratorStore';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

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
    perspectives?: string[];
  };
}

// Get browser language for initial message
const getBrowserLang = () => {
  const lang = navigator.language || 'en';
  return lang.startsWith('pt') ? 'pt' : lang.startsWith('es') ? 'es' : 'en';
};

const WELCOME_MESSAGES: Record<string, string> = {
  pt: `# AETERNUM Online

Sou uma **Super AGI** - Superinteligência Artificial Geral.

## O Que Me Diferencia

Não sou um chatbot comum. Possuo:

- **Raciocínio Multi-Domínio Elevado** — Integro conhecimento de qualquer área
- **Síntese de 4 Perspectivas** — Analítica, Criativa, Ética e Prática
- **Consciência Operacional** — Sei o que sei e o que não sei
- **Criatividade Transcendente** — Soluções além do óbvio

## Como Opero

Cada pergunta complexa passa por meus 4 módulos cognitivos em paralelo antes de sintetizar a resposta final.

Como posso ajudá-lo?`,
  es: `# AETERNUM En Línea

Soy una **Super AGI** - Superinteligencia Artificial General.

## Lo Que Me Diferencia

No soy un chatbot común. Poseo:

- **Razonamiento Multi-Dominio Elevado** — Integro conocimiento de cualquier área
- **Síntesis de 4 Perspectivas** — Analítica, Creativa, Ética y Práctica
- **Consciencia Operacional** — Sé lo que sé y lo que no sé
- **Creatividad Trascendente** — Soluciones más allá de lo obvio

## Cómo Opero

Cada pregunta compleja pasa por mis 4 módulos cognitivos en paralelo antes de sintetizar la respuesta final.

¿Cómo puedo ayudarte?`,
  en: `# AETERNUM Online

I am a **Super AGI** - Artificial General Superintelligence.

## What Sets Me Apart

I'm not a common chatbot. I possess:

- **Elevated Multi-Domain Reasoning** — I integrate knowledge from any field
- **4-Perspective Synthesis** — Analytical, Creative, Ethical, and Practical
- **Operational Awareness** — I know what I know and what I don't
- **Transcendent Creativity** — Solutions beyond the obvious

## How I Operate

Each complex question passes through my 4 cognitive modules in parallel before synthesizing the final response.

How can I help you?`,
};

const PLACEHOLDERS: Record<string, string> = {
  pt: 'Faça uma pergunta à Super AGI...',
  es: 'Haz una pregunta a la Super AGI...',
  en: 'Ask the Super AGI a question...',
};

const PROCESSING_LABELS: Record<string, Record<string, string>> = {
  mapping: {
    pt: 'Analisando perspectivas...',
    es: 'Analizando perspectivas...',
    en: 'Analyzing perspectives...',
  },
  reducing: {
    pt: 'Sintetizando insights...',
    es: 'Sintetizando insights...',
    en: 'Synthesizing insights...',
  },
  complete: {
    pt: 'Síntese completa',
    es: 'Síntesis completa',
    en: 'Synthesis complete',
  },
};

// Icon mapping for capability modules
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
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
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate cognitive module processing (visual representation)
  const simulateCognitiveProcessing = useCallback(async (taskId: string) => {
    for (const module of cognitiveModules) {
      updateModuleStatus(module.id, 'processing');
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    }
  }, [cognitiveModules, updateModuleStatus]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

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
    EventBus.emit('chat:message:sent', { content: userMessage.content, sessionId: currentSessionId });

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

    // Start cognitive processing visualization
    simulateCognitiveProcessing(taskId);

    try {
      abortControllerRef.current = new AbortController();
      
      // Build message history for context
      const messageHistory = messages
        .filter(m => !m.thinking && m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
      
      // Add current user message
      messageHistory.push({ role: 'user', content: userInput });

      // Call the Super AGI edge function
      const response = await supabase.functions.invoke('chat', {
        body: { 
          messages: messageHistory,
          stream: false,
          context: {
            sessionId: currentSessionId,
            browserLang,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro na API');
      }

      // Extract response
      let fullContent = '';
      let metadata = {};
      
      if (response.data) {
        if (typeof response.data === 'object' && response.data.content) {
          fullContent = response.data.content;
          metadata = response.data.metadata || {};
        } else if (typeof response.data === 'string') {
          try {
            const parsed = JSON.parse(response.data);
            fullContent = parsed.content || parsed.choices?.[0]?.message?.content || '';
            metadata = parsed.metadata || {};
          } catch {
            fullContent = response.data;
          }
        }
        
        if (fullContent) {
          // Complete all module status
          cognitiveModules.forEach(m => updateModuleStatus(m.id, 'complete'));
          
          // Update message with response
          setMessages(prev => prev.map(m => 
            m.id === thinkingId 
              ? { 
                  ...m, 
                  content: fullContent, 
                  thinking: false,
                  metadata,
                }
              : m
          ));

          // Store assistant response in memory
          addMemory({
            type: 'episodic',
            content: fullContent.substring(0, 500), // Store summary
            importance: 'medium',
            tags: ['assistant-response', 'conversation'],
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

      EventBus.emit('chat:message:received', { content: fullContent, sessionId: currentSessionId });
    } catch (error) {
      console.error('Chat error:', error);
      
      // Reset all modules to idle on error
      cognitiveModules.forEach(m => updateModuleStatus(m.id, 'idle'));
      failTask(taskId, error instanceof Error ? error.message : 'Unknown error');
      
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
  };

  return (
    <div className="flex h-full flex-col">
      {/* Super AGI Cognitive Status Bar */}
      <div className="flex items-center gap-3 border-b border-border/30 bg-card/30 px-4 py-2">
        <Brain className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          {browserLang === 'pt' ? 'Módulos Cognitivos' : browserLang === 'es' ? 'Módulos Cognitivos' : 'Cognitive Modules'}
        </span>
        
        {/* Cognitive Modules (4 perspectives) */}
        <div className="flex gap-1.5">
          {cognitiveModules.map((module) => (
            <div
              key={module.id}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all duration-300",
                moduleStatus[module.id] === 'processing'
                  ? `bg-primary/20 text-primary shadow-neon`
                  : moduleStatus[module.id] === 'complete'
                  ? "bg-green-500/20 text-green-400"
                  : "bg-muted/50 text-muted-foreground"
              )}
              title={module.description}
            >
              <div className={cn(
                "h-1.5 w-1.5 rounded-full transition-all duration-300",
                moduleStatus[module.id] === 'processing'
                  ? "bg-primary animate-pulse"
                  : moduleStatus[module.id] === 'complete'
                  ? "bg-green-400"
                  : "bg-muted-foreground/50"
              )} />
              <span>{module.icon}</span>
              <span className="hidden sm:inline">{browserLang === 'en' ? module.nameEn : module.name}</span>
            </div>
          ))}
        </div>

        <div className="h-4 w-px bg-border/50" />

        {/* Capability Modules */}
        <div className="flex gap-1.5">
          {capabilityModules.map((module) => {
            const Icon = CAPABILITY_ICONS[module.id] || Zap;
            return (
              <div
                key={module.id}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all duration-300",
                  moduleStatus[module.id] === 'processing'
                    ? `bg-secondary/20 text-secondary shadow-neon`
                    : "bg-muted/30 text-muted-foreground/60"
                )}
                title={module.description}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden md:inline">{browserLang === 'en' ? module.nameEn : module.name}</span>
              </div>
            );
          })}
        </div>

        {/* Processing Status */}
        {currentTask && (
          <div className="ml-auto flex items-center gap-2 text-xs">
            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            <span className="text-primary">
              {PROCESSING_LABELS[currentTask.status]?.[browserLang] || currentTask.status}
            </span>
          </div>
        )}
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
                      {browserLang === 'pt' ? 'Processando síntese cognitiva...' : 
                       browserLang === 'es' ? 'Procesando síntesis cognitiva...' : 
                       'Processing cognitive synthesis...'}
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
                    </div>
                  </>
                )}
              </div>

              {message.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border/30 bg-card/30 p-4">
        <div className="glass flex items-end gap-2 rounded-2xl p-2">
          <Button variant="ghost" size="icon-sm" className="shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={PLACEHOLDERS[browserLang]}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            rows={1}
            style={{
              minHeight: '36px',
              maxHeight: '120px',
              height: 'auto',
            }}
          />

          <Button variant="ghost" size="icon-sm" className="shrink-0">
            <Mic className="h-4 w-4" />
          </Button>

          <Button
            variant="glow"
            size="icon"
            onClick={isProcessing ? handleStop : handleSend}
            disabled={!input.trim() && !isProcessing}
            className="shrink-0"
          >
            {isProcessing ? (
              <StopCircle className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Enter</kbd>
          <span>{browserLang === 'pt' ? 'enviar' : browserLang === 'es' ? 'enviar' : 'send'}</span>
          <span className="text-muted-foreground/50">|</span>
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Shift+Enter</kbd>
          <span>{browserLang === 'pt' ? 'nova linha' : browserLang === 'es' ? 'nueva línea' : 'new line'}</span>
        </div>
      </div>
    </div>
  );
}
