/**
 * CHAT ENGINE COMPONENT
 * 
 * Multi-persona AI chat interface with orchestration visualization.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, StopCircle, Sparkles, Bot, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ModuleComponentProps } from '@/core/ModuleRegistry';
import { EventBus } from '@/core/EventBus';
import { useGlobalStore } from '@/stores/globalStore';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  persona?: string;
  thinking?: boolean;
}

const PERSONAS = [
  { id: 'biologist', name: 'Biologist', color: 'text-neon-green' },
  { id: 'physicist', name: 'Physicist', color: 'text-neon-blue' },
  { id: 'ethicist', name: 'Ethicist', color: 'text-neon-purple' },
  { id: 'engineer', name: 'Engineer', color: 'text-neon-orange' },
];

export function ChatEngine({ isActive }: ModuleComponentProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Welcome to Aeternum. I am ready to assist you with multi-persona analysis. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePersonas, setActivePersonas] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { updateTelemetry } = useGlobalStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateOrchestration = async (prompt: string) => {
    const taskId = Date.now().toString();
    EventBus.emit('orchestrator:start', { taskId, prompt });

    // Simulate each persona thinking
    for (const persona of PERSONAS) {
      setActivePersonas(prev => [...prev, persona.id]);
      EventBus.emit('orchestrator:persona:start', { taskId, persona: persona.id });
      
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
      
      EventBus.emit('orchestrator:persona:end', { taskId, persona: persona.id, result: {} });
    }

    // Simulate synthesis
    await new Promise(resolve => setTimeout(resolve, 300));
    setActivePersonas([]);
    
    EventBus.emit('orchestrator:complete', { taskId, result: {} });
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
    setInput('');
    setIsProcessing(true);

    const startTime = Date.now();
    EventBus.emit('chat:message:sent', { content: userMessage.content, sessionId: 'demo' });

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
      // Simulate orchestration
      await simulateOrchestration(userMessage.content);

      // Simulate response delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const latency = Date.now() - startTime;
      updateTelemetry({ latencyMs: latency, tokensPerSecond: 25 + Math.random() * 15 });

      // Replace thinking with actual response
      const response: Message = {
        id: thinkingId,
        role: 'assistant',
        content: generateDemoResponse(userMessage.content),
        timestamp: new Date(),
      };

      setMessages(prev => prev.map(m => m.id === thinkingId ? response : m));
      EventBus.emit('chat:message:received', { content: response.content, sessionId: 'demo' });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Persona Status Bar */}
      <div className="flex items-center gap-2 border-b border-border/30 bg-card/30 px-4 py-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs text-muted-foreground">Active Personas:</span>
        <div className="flex gap-2">
          {PERSONAS.map((persona) => (
            <div
              key={persona.id}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all duration-300",
                activePersonas.includes(persona.id)
                  ? `bg-primary/20 ${persona.color} shadow-neon`
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              <div className={cn(
                "h-1.5 w-1.5 rounded-full",
                activePersonas.includes(persona.id)
                  ? "bg-current animate-pulse"
                  : "bg-muted-foreground/50"
              )} />
              {persona.name}
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-3",
                  message.role === 'user'
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
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
                    <span className="text-xs text-muted-foreground">Synthesizing responses...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
            placeholder="Enter your query..."
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
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
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

function generateDemoResponse(prompt: string): string {
  const responses = [
    `I've analyzed your query through multiple cognitive lenses:\n\n**Biological Perspective:** The patterns you describe align with natural adaptive systems that optimize for efficiency.\n\n**Physical Analysis:** From a physics standpoint, the energy dynamics suggest a stable equilibrium state.\n\n**Ethical Considerations:** There are important implications to consider regarding responsible implementation.\n\n**Engineering Solution:** A modular approach would provide the flexibility needed while maintaining system integrity.\n\nWould you like me to elaborate on any of these perspectives?`,
    
    `Processing your request with our multi-agent ensemble...\n\nAfter synthesizing insights from our specialized personas, here's the integrated analysis:\n\n1. **Core Understanding:** Your query touches on fundamental principles that span multiple domains.\n\n2. **Key Insights:** The interconnected nature of this topic requires a holistic approach.\n\n3. **Recommended Action:** I suggest we explore this iteratively, starting with the most critical aspects.\n\nHow would you like to proceed?`,
    
    `Excellent question. Let me provide a comprehensive response:\n\n🔬 **Scientific Foundation:** The underlying mechanisms are well-established and follow predictable patterns.\n\n⚙️ **Technical Implementation:** Several approaches are viable, each with distinct trade-offs.\n\n🎯 **Strategic Recommendation:** Focus on the highest-impact elements first.\n\nI'm ready to dive deeper into any specific aspect you'd like to explore.`,
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}
