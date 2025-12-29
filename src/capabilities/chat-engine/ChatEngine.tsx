/**
 * CHAT ENGINE COMPONENT
 * 
 * Real AI chat interface with streaming responses.
 * Connects to Super AGI backend via edge function.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, StopCircle, Sparkles, Bot, User, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ModuleComponentProps } from '@/core/ModuleRegistry';
import { EventBus } from '@/core/EventBus';
import { useGlobalStore } from '@/stores/globalStore';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  persona?: string;
  thinking?: boolean;
  error?: boolean;
}

// Super AGI Cognitive Modules - Multi-Domain Reasoning
const COGNITIVE_MODULES = [
  { id: 'analytical', name: 'Analítico', nameEn: 'Analytical', color: 'text-neon-green', desc: 'Dados, fatos, lógica' },
  { id: 'creative', name: 'Criativo', nameEn: 'Creative', color: 'text-neon-blue', desc: 'Possibilidades, inovação' },
  { id: 'ethical', name: 'Ético', nameEn: 'Ethical', color: 'text-neon-purple', desc: 'Implicações, consequências' },
  { id: 'practical', name: 'Prático', nameEn: 'Practical', color: 'text-neon-orange', desc: 'Aplicabilidade, ação' },
];

// Get browser language for initial message
const getBrowserLang = () => {
  const lang = navigator.language || 'en';
  return lang.startsWith('pt') ? 'pt' : lang.startsWith('es') ? 'es' : 'en';
};

const WELCOME_MESSAGES: Record<string, string> = {
  pt: `Olá! Sou **AETERNUM**, sua Super AGI.

Diferente de um chatbot comum, possuo **raciocínio multi-domínio** - sintetizo conhecimento de múltiplas perspectivas (analítica, criativa, ética e prática) para gerar insights que transcendem respostas convencionais.

Como posso ajudá-lo hoje?`,
  es: `¡Hola! Soy **AETERNUM**, tu Super AGI.

A diferencia de un chatbot común, poseo **razonamiento multi-dominio** - sintetizo conocimiento desde múltiples perspectivas (analítica, creativa, ética y práctica) para generar insights que trascienden respuestas convencionales.

¿Cómo puedo ayudarte hoy?`,
  en: `Hello! I am **AETERNUM**, your Super AGI.

Unlike a regular chatbot, I possess **multi-domain reasoning** - I synthesize knowledge from multiple perspectives (analytical, creative, ethical, and practical) to generate insights that transcend conventional responses.

How can I help you today?`,
};

const PLACEHOLDERS: Record<string, string> = {
  pt: 'Digite sua mensagem...',
  es: 'Escribe tu mensaje...',
  en: 'Type your message...',
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
  const [activePersonas, setActivePersonas] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { updateTelemetry } = useGlobalStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateCognitiveProcessing = async () => {
    // Simulate cognitive modules processing - represents multi-domain reasoning
    for (const module of COGNITIVE_MODULES) {
      setActivePersonas(prev => [...prev, module.id]);
      await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 250));
    }
    
    // Synthesis phase - integrating perspectives
    await new Promise(resolve => setTimeout(resolve, 300));
    setActivePersonas([]);
  };

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

    const startTime = Date.now();
    EventBus.emit('chat:message:sent', { content: userMessage.content, sessionId: 'main' });

    // Add thinking indicator
    const thinkingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: thinkingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      thinking: true,
    }]);

    // Start cognitive processing visualization - shows multi-perspective analysis
    simulateCognitiveProcessing();

    try {
      abortControllerRef.current = new AbortController();
      
      // Build message history for context - only user and assistant messages
      const messageHistory = messages
        .filter(m => !m.thinking && m.role !== 'system')
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));
      
      // Add current user message
      messageHistory.push({ role: 'user', content: userInput });

      // Call the edge function - use non-streaming for reliability with supabase.functions.invoke
      const response = await supabase.functions.invoke('chat', {
        body: { 
          messages: messageHistory,
          stream: false, // supabase.functions.invoke doesn't handle SSE properly
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro na API');
      }

      // Handle response
      let fullContent = '';
      
      if (response.data) {
        // Non-streaming response - extract content directly
        if (typeof response.data === 'object' && response.data.content) {
          fullContent = response.data.content;
        } else if (typeof response.data === 'string') {
          // Try to parse if it's a JSON string
          try {
            const parsed = JSON.parse(response.data);
            fullContent = parsed.content || parsed.choices?.[0]?.message?.content || '';
          } catch {
            fullContent = response.data;
          }
        }
        
        if (fullContent) {
          setMessages(prev => prev.map(m => 
            m.id === thinkingId 
              ? { ...m, content: fullContent, thinking: false }
              : m
          ));
        }
      }

      // If no content was extracted, show error
      if (!fullContent) {
        throw new Error('Resposta vazia da IA');
      }

      const latency = Date.now() - startTime;
      const tokensPerSec = fullContent.length / (latency / 1000) * 0.75; // Rough estimate
      updateTelemetry({ latencyMs: latency, tokensPerSecond: tokensPerSec });

      EventBus.emit('chat:message:received', { content: fullContent, sessionId: 'main' });
    } catch (error) {
      console.error('Chat error:', error);
      
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
      setActivePersonas([]);
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
    setActivePersonas([]);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Super AGI Cognitive Modules Status Bar */}
      <div className="flex items-center gap-2 border-b border-border/30 bg-card/30 px-4 py-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">
          {browserLang === 'pt' ? 'Síntese Cognitiva:' : browserLang === 'es' ? 'Síntesis Cognitiva:' : 'Cognitive Synthesis:'}
        </span>
        <div className="flex gap-2">
          {COGNITIVE_MODULES.map((module) => (
            <div
              key={module.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all duration-300",
                activePersonas.includes(module.id)
                  ? `bg-primary/20 ${module.color} shadow-neon`
                  : "bg-muted/50 text-muted-foreground"
              )}
              title={module.desc}
            >
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                activePersonas.includes(module.id)
                  ? "bg-current animate-pulse"
                  : "bg-muted-foreground/50"
              )} />
              {browserLang === 'en' ? module.nameEn : module.name}
            </div>
          ))}
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
                  "max-w-[70%] rounded-2xl px-4 py-3",
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
                      {browserLang === 'pt' ? 'Processando...' : browserLang === 'es' ? 'Procesando...' : 'Processing...'}
                    </span>
                  </div>
                ) : (
                  <>
                    <p className={cn(
                      "text-sm whitespace-pre-wrap",
                      message.error && "text-destructive"
                    )}>
                      {message.content}
                    </p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {message.timestamp.toLocaleTimeString()}
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
          <span>Press</span>
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Enter</kbd>
          <span>to send,</span>
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Shift+Enter</kbd>
          <span>for new line</span>
        </div>
      </div>
    </div>
  );
}
