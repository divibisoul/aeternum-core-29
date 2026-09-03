import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const EXPECTED = '1.1.0';
const localEnvelopeSource = resolve(process.cwd(), 'lib/soul-mesh/SoulMeshEnvelope.ts');
const localServerSource = resolve(process.cwd(), 'scripts/soul-mesh-server.mjs');
const envelopeSource = await readFile(localEnvelopeSource, 'utf8');
const serverSource = await readFile(localServerSource, 'utf8');

assert.match(envelopeSource, /contractVersion/, 'N01 envelope: canonical contractVersion is absent');
assert.ok(
  envelopeSource.includes(`SOUL_MESH_CONTRACT_VERSION = '${EXPECTED}'`),
  `N01 envelope: canonical contract version ${EXPECTED} is not present`,
);

// The current SOUL topology has seven nuclei: N01 plus six peers.
// Six peers produce 42 directed links and 21 bidirectional pairs.
assert.match(serverSource, /const PEER_IDS = \['N02', 'N03', 'N04', 'N05', 'N06', 'N07'\];/,
  'N01 server: N07 is missing from the structural peer set');
assert.match(serverSource, /directionalChannels:42/,
  'N01 fusion snapshot: directional channel count must be 42');
assert.match(serverSource, /if\(!PEER_IDS\.includes\(body\.nucleus\)\|\|!normalizeUrl\(body\.endpoint\)\)/,
  'N01 registration: structural peer validation is not based on the canonical peer set');
assert.match(serverSource, /if\(!PEER_IDS\.includes\(id\)\|\|!expected\|\|provided!==expected\)/,
  'N01 heartbeat: structural peer validation is not based on the canonical peer set');
assert.match(serverSource, /if\(!PEER_IDS\.includes\(target\)\|\|target===SELF\)/,
  'N01 delegation: canonical peer set is not used for target validation');

console.log(`SOUL_MESH_CONTRACT: ok=true local=N01 version=${EXPECTED}`);
console.log('SOUL_MESH_PEERS: ok=true nuclei=N01..N07 peers=6 directionalChannels=42 bidirectionalPairs=21');
console.log('Peer runtime commissioning remains delegated to each peer repository CI and the final global Mesh gate.');
