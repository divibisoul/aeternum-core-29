import { strict as assert } from 'node:assert';

const SOURCES = [
  ['N01 envelope', 'https://raw.githubusercontent.com/divibisoul/aeternum-core-29/main/lib/soul-mesh/SoulMeshEnvelope.ts'],
  ['N02 endpoint', 'https://raw.githubusercontent.com/divibisoul/Eternium-/main/api/soul-mesh.ts'],
  ['N03 endpoint', 'https://raw.githubusercontent.com/divibisoul/nexus-aeternum-fusion/main/api/soul-mesh.ts'],
  ['N04 runtime', 'https://raw.githubusercontent.com/divibisoul/nextjs-ai-chatbots/main/lib/soul-core/Nucleus04MeshRuntime.ts'],
  ['N05 endpoint', 'https://raw.githubusercontent.com/divibisoul/nextjs-ai-chatbot/main/app/api/soul-mesh/route.ts'],
  ['N06 endpoint', 'https://raw.githubusercontent.com/divibisoul/nextjs-ai-chatbot-2000/main/app/api/soul-mesh/route.ts'],
];

const EXPECTED = '1.1.0';

for (const [name, url] of SOURCES) {
  const response = await fetch(url, { cache: 'no-store' });
  assert.equal(response.ok, true, `${name}: source unavailable (${response.status})`);
  const source = await response.text();
  assert.match(source, /contractVersion/, `${name}: canonical contractVersion is absent`);
  if (name !== 'N01 envelope') {
    assert.match(source, new RegExp(EXPECTED.replaceAll('.', '\\.'), 'g'), `${name}: canonical contract version ${EXPECTED} is not present`);
  }
}

console.log(`SOUL_MESH_CONTRACT: ok=true version=${EXPECTED} nuclei=${SOURCES.length}`);
