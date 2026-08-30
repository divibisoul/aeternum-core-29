import assert from 'node:assert/strict';
import { inferInitialIntent } from './n01-byok-gemini.mjs';

const original = process.env.GEMINI_API_KEY;
delete process.env.GEMINI_API_KEY;
try {
  await assert.rejects(
    () => inferInitialIntent({ text: 'test' }),
    (error) => error instanceof Error && error.message === 'GEMINI_API_KEY_REQUIRED',
  );
  console.log('N01 BYOK adapter wiring: OK');
} finally {
  if (original === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = original;
}
