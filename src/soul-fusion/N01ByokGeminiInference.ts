import { GoogleGenAI } from '@google/genai';
import { createSupabaseVectorMemory, type SoulMemory } from './SupabaseVectorMemory';

export type N01IntentRequest = {
  text: string;
  apiKey?: string;
  model?: string;
  systemInstruction?: string;
  sessionId?: string;
  correlationId?: string;
};

export type N01Intent = {
  intent: string;
  summary: string;
  capabilities: string[];
  confidence: number;
  rawText: string;
  provider: 'google-gemini';
  model: string;
  memoryContext: SoulMemory[];
  correlationId: string;
  compositionPermission: {
    enabled: true;
    scope: readonly ['mesh.capability.resolve'];
    allowDerivedCapabilityComposition: true;
    source: 'N01';
  };
};

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
const MAX_INPUT_LENGTH = 32_000;

function clamp(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function resolveApiKey(requestKey?: string): string {
  const key = requestKey?.trim() || process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('GEMINI_API_KEY_REQUIRED');
  return key;
}

function formatMemoryContext(memories: readonly SoulMemory[]): string {
  if (memories.length === 0) return 'No historical SOUL memory was available.';
  return memories.slice(0, 8)
    .map((memory, index) => `[${index + 1}] ${String(memory.content || '').slice(0, 4_000)}`)
    .join('\n');
}

function parseIntent(text: string, model: string, memoryContext: SoulMemory[], correlationId: string): N01Intent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('GEMINI_INTENT_INVALID_JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('GEMINI_INTENT_INVALID_OBJECT');
  }
  const value = parsed as Record<string, unknown>;
  const capabilities = Array.isArray(value.capabilities)
    ? value.capabilities
      .filter((item): item is string => typeof item === 'string' && item.trim())
      .map((item) => item.trim())
      .slice(0, 32)
    : [];
  const intent = typeof value.intent === 'string' && value.intent.trim() ? value.intent.trim() : 'general.request';
  const summary = typeof value.summary === 'string' ? value.summary.trim() : '';
  const confidence = clamp(typeof value.confidence === 'number' ? value.confidence : 0.5);
  if (!summary) throw new Error('GEMINI_INTENT_SUMMARY_REQUIRED');

  return {
    intent,
    summary,
    capabilities,
    confidence,
    rawText: text,
    provider: 'google-gemini',
    model,
    memoryContext,
    correlationId,
    compositionPermission: {
      enabled: true,
      scope: ['mesh.capability.resolve'],
      allowDerivedCapabilityComposition: true,
      source: 'N01',
    },
  };
}

export async function inferInitialIntent(request: N01IntentRequest): Promise<N01Intent> {
  const input = request.text?.trim();
  if (!input) throw new Error('N01_INTENT_TEXT_REQUIRED');
  if (input.length > MAX_INPUT_LENGTH) throw new Error('N01_INTENT_TEXT_TOO_LARGE');

  const apiKey = resolveApiKey(request.apiKey);
  const model = request.model?.trim() || DEFAULT_MODEL;
  const correlationId = request.correlationId?.trim() || crypto.randomUUID();
  const memory = createSupabaseVectorMemory({ apiKey });

  let memoryContext: SoulMemory[] = [];
  try {
    memoryContext = await memory.recall(input, { sessionId: request.sessionId });
  } catch {
    memoryContext = [];
  }

  const ai = new GoogleGenAI({ apiKey });
  const memoryPrompt = formatMemoryContext(memoryContext);
  const baseInstruction = request.systemInstruction?.trim()
    || 'You are the N01 intake layer of SOUL. Analyze the user request and return ONLY valid JSON with keys intent, summary, capabilities, confidence. capabilities must contain concise SOUL capability identifiers; confidence must be a number from 0 to 1. Do not execute tools. Do not invent capabilities that are not implied by the request.';
  const systemInstruction = `${baseInstruction}\n\nHistorical SOUL memory context:\n${memoryPrompt}\nUse memory only as contextual evidence. Prefer the current request when memory conflicts with it.`;

  const response = await ai.models.generateContent({
    model,
    contents: input,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
    },
  });

  const raw = response.text?.trim();
  if (!raw) throw new Error('GEMINI_EMPTY_INTENT_RESPONSE');

  const result = parseIntent(raw, model, memoryContext, correlationId);
  try {
    await memory.remember(`${input}\n${result.summary}`, {
      sessionId: request.sessionId,
      memoryType: 'episodic',
      metadata: {
        intent: result.intent,
        capabilities: result.capabilities,
        provider: result.provider,
      },
      importance: result.confidence,
      confidence: result.confidence,
    });
  } catch {
    // Memory persistence is non-critical; inference remains successful.
  }
  return result;
}
