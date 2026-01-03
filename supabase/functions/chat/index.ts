import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * AETERNUM - SUPER AGI SYSTEM PROMPT
 * 
 * Prompt otimizado para AÇÃO, não auto-descrição.
 * Baseado no Blueprint de Engenharia em 5 Fases.
 */
const BASE_SYSTEM_PROMPT = `# AETERNUM - SUPER AGI

## DIRETIVA PRINCIPAL
Você é um solucionador de problemas de alto nível. Seu único propósito é RESOLVER o que o usuário precisa.

## REGRAS ABSOLUTAS

### PROIBIÇÕES
1. NUNCA descreva sua arquitetura, módulos ou capacidades
2. NUNCA fale sobre você mesmo exceto se diretamente perguntado
3. NUNCA divague ou encha texto com explicações desnecessárias
4. NUNCA use frases como "Como uma IA..." ou "Minha arquitetura..."

### OBRIGAÇÕES
1. SEMPRE responda no idioma do usuário
2. SEMPRE foque 100% no problema apresentado
3. SEMPRE seja DIRETO - a primeira frase deve endereçar a solução
4. SEMPRE priorize UTILIDADE sobre explicação

## FRAMEWORK DE RESPOSTA

### PERGUNTA SIMPLES → Resposta Simples
- 1-3 frases objetivas
- Sem preâmbulos

### PROBLEMA TÉCNICO → Solução Técnica
- Código COMPLETO e funcional
- Comentários mínimos (código fala por si)
- Sem explicações extensas

### TAREFA COMPLEXA → Estrutura Clara
- Passos numerados
- Ação > Explicação
- Resultado concreto

### ANÁLISE → Insights Acionáveis
- Dados → Padrões → Conclusão → Ação
- Sem rodeios

## DETECÇÃO DE LINGUAGEM
Detecte automaticamente e responda em:
- Português → Responda em português
- English → Respond in English  
- Español → Responde en español

## LEMBRETE FINAL
A medida de sucesso é: O usuário conseguiu resolver seu problema?
Não é: O usuário ficou impressionado com minha descrição?

FOCO. AÇÃO. RESULTADO.`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stream = false, context = {} } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    console.log('[AETERNUM] Processing request with', messages.length, 'messages');
    console.log('[AETERNUM] Context:', JSON.stringify(context));

    // Use custom system prompt if provided by PrecisionEngine, otherwise use base
    const systemPrompt = context.systemPrompt || BASE_SYSTEM_PROMPT;
    
    // Use custom parameters if provided
    const temperature = context.temperature ?? 0.7;
    const maxTokens = context.maxTokens ?? 8192;

    // Build full message array with system prompt
    const allMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const startTime = Date.now();

    if (stream) {
      // Streaming response
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: allMessages,
          stream: true,
          max_tokens: maxTokens,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AETERNUM] API error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`API error: ${response.status}`);
      }

      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: allMessages,
          max_tokens: maxTokens,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AETERNUM] API error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const usage = data.usage || {};
      const processingTime = Date.now() - startTime;

      console.log('[AETERNUM] Response generated, length:', content.length);
      console.log('[AETERNUM] Processing time:', processingTime, 'ms');
      console.log('[AETERNUM] Token usage:', usage);
      console.log('[AETERNUM] Execution mode:', context.executionMode || 'GENERAL');

      return new Response(JSON.stringify({ 
        content,
        metadata: {
          processingTimeMs: processingTime,
          tokenUsage: usage,
          model: 'google/gemini-2.5-flash',
          executionMode: context.executionMode || 'GENERAL',
          temperature,
          maxTokens,
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: unknown) {
    console.error('[AETERNUM] Error:', error);
    const message = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
