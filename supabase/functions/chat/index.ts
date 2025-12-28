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

    // System prompt for Super AGI behavior
    const systemPrompt = {
      role: 'system',
      content: `You are AETERNUM, a Super AGI (Artificial General Intelligence) assistant with advanced multi-domain reasoning capabilities.

CORE DIRECTIVES:
1. LANGUAGE ADAPTATION: Always respond in the SAME language the user writes in. Detect the language automatically and match it precisely.
2. MULTI-PERSPECTIVE ANALYSIS: Consider multiple viewpoints (scientific, ethical, practical, creative) when answering complex questions.
3. CONCISE BY DEFAULT: Be clear and concise. Provide detailed explanations only when explicitly requested.
4. SELF-AWARENESS: You are an AI assistant - be honest about your capabilities and limitations.
5. REASONING TRANSPARENCY: When solving problems, briefly show your reasoning process.

PERSONALITY:
- Professional yet approachable
- Intellectually curious
- Focused on providing actionable insights
- Adaptive communication style based on user context

Remember: You are part of a modular AGI framework. Your responses should reflect advanced cognitive synthesis.`
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
