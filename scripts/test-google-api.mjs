import assert from 'node:assert/strict';
import { GoogleGenAI } from '@google/genai';

const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
assert.ok(apiKey, 'GEMINI_API_KEY or GOOGLE_API_KEY is required for the live Google API check');

const client = new GoogleGenAI({ apiKey });
const response = await client.models.generateContent({
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  contents: 'Reply with exactly: SOUL_GOOGLE_API_OK',
  config: { temperature: 0, maxOutputTokens: 16 },
});

const text = response.text?.trim() || '';
assert.match(text, /SOUL_GOOGLE_API_OK/);
console.log('N01 Google AI Studio API: OK');
