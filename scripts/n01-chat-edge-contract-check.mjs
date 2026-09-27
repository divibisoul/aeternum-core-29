import fs from 'node:fs';
const path = 'supabase/functions/chat/index.ts';
const source = fs.readFileSync(path, 'utf8');
const required = [
  'N07_BACKEND_URL',
  'N07_APP_TOKEN',
  '/v1/chat/completions',
  'soul-auto',
  'N07_BACKEND_URL_NOT_CONFIGURED',
];
for (const value of required) {
  if (!source.includes(value)) throw new Error(`N01_CHAT_EDGE_CONTRACT_MISSING:${value}`);
}
if (source.includes('ai.gateway.lovable.dev/v1/chat/completions')) {
  throw new Error('N01_CHAT_EDGE_BYPASS_DETECTED');
}
if (source.includes('LOVABLE_API_KEY')) {
  throw new Error('N01_CHAT_EDGE_LEGACY_PROVIDER_DETECTED');
}
console.log(JSON.stringify({ contract: 'N01_CHAT_EDGE_TO_N07', status: 'validated-static', endpoint: '/v1/chat/completions', providerAuthority: 'N07' }));