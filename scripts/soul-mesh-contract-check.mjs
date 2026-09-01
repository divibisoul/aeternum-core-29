import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const EXPECTED = '1.1.0';
const localSource = resolve(process.cwd(), 'lib/soul-mesh/SoulMeshEnvelope.ts');
const source = await readFile(localSource, 'utf8');

assert.match(source, /contractVersion/, 'N01 envelope: canonical contractVersion is absent');
assert.ok(
  source.includes(`SOUL_MESH_CONTRACT_VERSION = '${EXPECTED}'`),
  `N01 envelope: canonical contract version ${EXPECTED} is not present`,
);

console.log(`SOUL_MESH_CONTRACT: ok=true local=N01 version=${EXPECTED}`);
console.log('Peer contract validation is delegated to each peer repository CI; private peer source is not fetched anonymously.');
