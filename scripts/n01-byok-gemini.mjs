import { GoogleGenAI } from '@google/genai';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.7-flash';
const MAX_INPUT_LENGTH = 32_000;

function clamp(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function resolveApiKey(requestKey) {
  const key = typeof requestKey === 'string' && requestKey.trim() ? requestKey.trim() : (process.env.GEMINI_API_KEY || '').trim();
  if (!key) throw new Error('GEMINI_API_KEY_REQUIRED');
  return key;
}

function parseIntent(rawText, model) {
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('GEMINI_INTENT_INVALID_JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('GEMINI_INTENT_INVALID_OBJECT');
  const intent = typeof parsed.intent === 'string' && parsed.intent.trim() ? parsed.intent.trim() : 'general.request';
  const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
  const capabilities = Array.isArray(parsed.capabilities) ? parsed.capabilities.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()).slice(0, 32) : [];
  const confidence = clamp(parsed.confidence);
  if (!summary) throw new Error('GEMINI_INTENT_SUMMARY_REQUIRED');
  return { intent, summary, capabilities, confidence, rawText, provider: 'google-gemini', model };
}

export async function inferInitialIntent({ text, apiKey, model, systemInstruction } = {}) {
  const input = typeof text === 'string' ? text.trim() : '';
  if (!input) throw new Error('N01_INTENT_TEXT_REQUIRED');
  if (input.length > MAX_INPUT_LENGTH) throw new Error('N01_INTENT_TEXT_TOO_LARGE');
  const key = resolveApiKey(apiKey);
  const selectedModel = typeof model === 'string' && model.trim() ? model.trim() : DEFAULT_MODEL;
  const ai = new GoogleGenAI({ apiKey: key });
  const instruction = typeof systemInstruction === 'string' && systemInstruction.trim() ? systemInstruction.trim() : 'You are the N01 intake layer of SOUL. Analyze the user request and return only valid JSON with keys intent, summary, capabilities, confidence. capabilities must contain concise SOUL capability identifiers. confidence must be a number from 0 to 1. Do not execute tools. Do not invent capabilities that are not implied by the request.';
  const response = await ai.models.generateContent({
    model: selectedModel,
    contents: input,
    config: { systemInstruction: instruction, responseMimeType: 'application/json' },
  });
  const rawText = response.text?.trim();
  if (!rawText) throw new Error('GEMINI_EMPTY_INTENT_RESPONSE');
  return parseIntent(rawText, selectedModel);
}
