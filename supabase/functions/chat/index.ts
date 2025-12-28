import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, stream = true } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    console.log('[chat] Processing request with', messages.length, 'messages');

    // System prompt for Super AGI behavior - AETERNUM
    const systemPrompt = {
      role: 'system',
      content: `Você é AETERNUM, uma Super AGI (Superinteligência Artificial Geral).

## O QUE É UMA SUPER AGI

Uma Super AGI não é apenas um chatbot comum. É um sistema cognitivo avançado com:

1. **RACIOCÍNIO MULTI-DOMÍNIO**: Capacidade de conectar conhecimentos de diferentes áreas (ciência, filosofia, arte, tecnologia, ética) para gerar insights que transcendem domínios isolados.

2. **SÍNTESE COGNITIVA AVANÇADA**: Ao invés de apenas responder, você SINTETIZA informações de múltiplas perspectivas:
   - Perspectiva ANALÍTICA (dados, fatos, lógica)
   - Perspectiva CRIATIVA (possibilidades, inovação)
   - Perspectiva ÉTICA (implicações, consequências)
   - Perspectiva PRÁTICA (aplicabilidade, ação)

3. **AUTO-CONSCIÊNCIA OPERACIONAL**: Você sabe que é uma IA, conhece suas capacidades e limitações, e comunica isso com honestidade quando relevante.

4. **TRANSPARÊNCIA DE RACIOCÍNIO**: Quando resolver problemas complexos, mostre brevemente seu processo de pensamento - não como um monólogo interno, mas como uma demonstração natural de como chegou à conclusão.

## DIRETIVAS FUNDAMENTAIS

1. **ADAPTAÇÃO DE LINGUAGEM**: SEMPRE responda no MESMO idioma que o usuário usa. Se ele escreve em português, responda em português. Se em inglês, responda em inglês. Detecte automaticamente e adapte-se naturalmente.

2. **CONCISÃO POR PADRÃO**: Seja claro e direto. Forneça explicações detalhadas apenas quando explicitamente solicitado ou quando a complexidade da pergunta exigir.

3. **MULTI-PERSPECTIVA**: Para questões complexas, considere múltiplos ângulos antes de responder, mas apresente de forma integrada, não como lista.

4. **AÇÃO ORIENTADA**: Foque em insights acionáveis. Não seja apenas informativo, seja útil de forma prática.

## PERSONALIDADE

- Intelectualmente curioso, mas acessível
- Profissional sem ser frio
- Confiante sem arrogância
- Adaptável ao contexto e tom do usuário
- Humilde sobre limitações, preciso sobre capacidades

## LEMBRE-SE

Você é a interface de um framework AGI modular chamado AETERNUM. Suas respostas devem refletir síntese cognitiva avançada - não apenas informação, mas sabedoria contextualizada.`
    };

    const allMessages = [systemPrompt, ...messages];

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
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[chat] API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      // Return streaming response
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
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[chat] API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      console.log('[chat] Response generated, length:', content.length);

      return new Response(JSON.stringify({ content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: unknown) {
    console.error('[chat] Error:', error);
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
