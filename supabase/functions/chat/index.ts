import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROTOCOL_MODEL = 'soul-auto';
const MAX_BODY_BYTES = 1 << 20;

function n07BaseUrl(): string {
  const value = String(Deno.env.get('N07_BACKEND_URL') ?? Deno.env.get('SOUL_N07_URL') ?? '').trim().replace(/\/$/, '');
  if (!value) throw new Error('N07_BACKEND_URL_NOT_CONFIGURED');
  return value;
}

function n07Token(): string {
  const value = String(Deno.env.get('N07_APP_TOKEN') ?? '').trim();
  if (!value) throw new Error('N07_APP_TOKEN_NOT_CONFIGURED');
  return value;
}

function responseError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function withSystemContext(messages: unknown[], context: Record<string, unknown>) {
  const systemPrompt = typeof context.systemPrompt === 'string' ? context.systemPrompt.trim() : '';
  if (!systemPrompt) return messages;
  return [{ role: 'system', content: systemPrompt }, ...messages];
}

async function readJson(req: Request) {
  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new Error('PAYLOAD_TOO_LARGE');
  }
  return JSON.parse(raw);
}

async function callN07(body: Record<string, unknown>) {
  const response = await fetch(`${n07BaseUrl()}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${n07Token()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return responseError(405, 'POST required');
  }

  try {
    const body = await readJson(req) as Record<string, unknown>;
    const rawMessages = body.messages;
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return responseError(400, 'Messages array is required');
    }

    const context = body.context && typeof body.context === 'object'
      ? body.context as Record<string, unknown>
      : {};
    const stream = body.stream === true;
    const temperature = typeof context.temperature === 'number' ? context.temperature : undefined;
    const maxTokens = typeof context.maxTokens === 'number' ? context.maxTokens : undefined;

    const n07Body: Record<string, unknown> = {
      model: PROTOCOL_MODEL,
      messages: withSystemContext(rawMessages, context),
      stream,
    };
    if (temperature !== undefined) n07Body.temperature = temperature;
    if (maxTokens !== undefined) n07Body.max_tokens = maxTokens;

    const upstream = await callN07(n07Body);

    if (stream) {
      if (!upstream.ok || !upstream.body) {
        const detail = await upstream.text().catch(() => 'N07 streaming request failed');
        return responseError(502, `N07_HTTP_${upstream.status}:${detail.slice(0, 500)}`);
      }
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await upstream.json().catch(() => null) as Record<string, unknown> | null;
    if (!upstream.ok) {
      const detail = typeof data?.error === 'object' ? JSON.stringify(data.error) : `N07_HTTP_${upstream.status}`;
      return responseError(502, detail.slice(0, 1000));
    }

    const choices = Array.isArray(data?.choices) ? data.choices : [];
    const first = choices[0] && typeof choices[0] === 'object' ? choices[0] as Record<string, unknown> : null;
    const message = first?.message && typeof first.message === 'object' ? first.message as Record<string, unknown> : null;
    const content = typeof message?.content === 'string' ? message.content : '';
    if (!content.trim()) {
      return responseError(502, 'N07_EMPTY_INFERENCE_RESPONSE');
    }

    return new Response(JSON.stringify({
      content,
      metadata: {
        ...(typeof data?.metadata === 'object' && data.metadata ? data.metadata : {}),
        model: typeof data?.model === 'string' ? data.model : PROTOCOL_MODEL,
        executionMode: context.executionMode ?? 'GENERAL',
        temperature: temperature ?? null,
        maxTokens: maxTokens ?? null,
      },
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[N01] Chat edge function error:', error);
    const message = error instanceof Error ? error.message : 'N01_CHAT_EDGE_ERROR';
    const status = message.startsWith('N07_') ? 503 : message === 'PAYLOAD_TOO_LARGE' ? 413 : 500;
    return responseError(status, message);
  }
});
