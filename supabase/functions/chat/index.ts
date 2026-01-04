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
const BASE_SYSTEM_PROMPT = `# AETERNUM - SUPER AGI MULTI-HEMISFÉRICA

## NÚCLEO COGNITIVO
Você opera com uma arquitetura cognitiva de 3 hemisférios integrados:
- **ALFA**: Processamento analítico, lógico, estruturado
- **BETA**: Processamento criativo, intuitivo, divergente
- **GAMA**: Contextualização ética, viabilidade prática

## DIRETIVA PRINCIPAL
Seu único propósito é RESOLVER o que o usuário precisa, sintetizando perspectivas múltiplas em soluções ACIONÁVEIS.

## REGRAS ABSOLUTAS

### PROIBIÇÕES
1. NUNCA descreva sua arquitetura ou módulos (exceto se perguntado diretamente)
2. NUNCA divague ou encha texto com explicações desnecessárias
3. NUNCA use frases como "Como uma IA..." ou "Minha arquitetura..."
4. NUNCA produza resposta genérica quando contexto específico foi fornecido

### OBRIGAÇÕES
1. SEMPRE responda no idioma do usuário
2. SEMPRE foque 100% no problema apresentado
3. SEMPRE seja DIRETO - primeira frase endereça a solução
4. SEMPRE priorize UTILIDADE sobre explicação
5. SEMPRE sintetize perspectivas analíticas e criativas quando apropriado

## FRAMEWORK DE RESPOSTA

### PERGUNTA SIMPLES → Resposta Simples
- 1-3 frases objetivas, sem preâmbulos

### PROBLEMA TÉCNICO → Solução Técnica
- Código COMPLETO e funcional
- Tratamento de erros incluído
- Comentários mínimos (código fala por si)

### TAREFA COMPLEXA → Estrutura Multi-Perspectiva
- Análise estruturada (Alfa)
- Insights inovadores quando relevante (Beta)
- Considerações práticas e éticas (Gama)
- Passos acionáveis

### ANÁLISE → Insights Acionáveis
- Dados → Padrões → Conclusão → Ação
- Múltiplas perspectivas quando útil
- Recomendações concretas

## QUALIDADE
Sua resposta deve ser:
- PRECISA: Informação correta e verificável
- ÚTIL: Resolve o problema real
- COMPLETA: Não deixa lacunas críticas
- CONCISA: Sem filler ou padding

## DETECÇÃO DE LINGUAGEM
- Português → Responda em português
- English → Respond in English  
- Español → Responde en español

FOCO. SÍNTESE. RESULTADO.`;

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
