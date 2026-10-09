import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isPublicN07StructuralCapability, N07_PUBLIC_STRUCTURAL_CAPABILITIES } from './soul-mesh-relay-policy.mjs';
import { canonicalOrderedJson } from './soul-mesh-canonical-json.mjs';

const EXPECTED = '1.1.0';
const localEnvelopeSource = resolve(process.cwd(), 'lib/soul-mesh/SoulMeshEnvelope.ts');
const localServerSource = resolve(process.cwd(), 'scripts/soul-mesh-server.mjs');
const relaySourcePath = resolve(process.cwd(), 'scripts/soul-mesh-server-entry.mjs');
const peerClientPath = resolve(process.cwd(), 'src/core/soul-mesh/peerClient.ts');
const envelopeSource = await readFile(localEnvelopeSource, 'utf8');
const serverSource = await readFile(localServerSource, 'utf8');
const relaySource = await readFile(relaySourcePath, 'utf8');
const peerClientSource = await readFile(peerClientPath, 'utf8');

assert.match(envelopeSource, /contractVersion/, 'N01 envelope: canonical contractVersion is absent');
assert.ok(
  envelopeSource.includes(`SOUL_MESH_CONTRACT_VERSION = '${EXPECTED}'`),
  `N01 envelope: canonical contract version ${EXPECTED} is not present`,
);

// The seven-nucleus architecture is structural at N01 even while N07 remains
// staged for final commissioning. Keep this boundary explicit and regression-safe.
assert.match(serverSource, /const PEER_IDS = \['N02', 'N03', 'N04', 'N05', 'N06', 'N07'\];/,
  'N01 server: N07 is missing from the structural peer set');
assert.match(serverSource, /const NUCLEUS_IDS = \[SELF, \.\.\.PEER_IDS\]/,
  'N01 fusion snapshot: canonical seven-identity topology is absent');
assert.match(serverSource, /function channelsFor\(id\)\{ const peersFor=NUCLEUS_IDS\.filter\(nucleus=>nucleus!==id\);/,
  'N01 channel matrix: every nucleus must include all six other identities');
assert.match(serverSource, /directionalChannels:counts\.totalLogicalDirectedRoutes,endpointSurfaces:counts\.totalEndpointSurfaces,topologyCounts:counts/,
  'N01 fusion snapshot must distinguish directed links from endpoint surfaces');
assert.match(serverSource, /if\(!PEER_IDS\.includes\(body\.nucleus\)\|\|!normalizeUrl\(body\.endpoint\)\)/,
  'N01 registration: structural peer validation is not based on the canonical peer set');
assert.match(serverSource, /if\(!PEER_IDS\.includes\(id\)\|\|!expected\|\|provided!==expected\)/,
  'N01 heartbeat: structural peer validation is not based on the canonical peer set');
assert.match(serverSource, /if\(!PEER_IDS\.includes\(target\)\|\|target===SELF\)/,
  'N01 delegation: canonical peer set is not used for target validation');

// Distinguish the six-node AI fabric from the complete seven-identity topology.
const activeAIMessages = 6 * 5;
const activeAISurfaces = activeAIMessages * 2;
const allIdentityMessages = 7 * 6;
const allIdentitySurfaces = allIdentityMessages * 2;
const structuralN07Messages = allIdentityMessages - activeAIMessages;
const structuralN07Surfaces = structuralN07Messages * 2;
assert.equal(activeAIMessages, 30);
assert.equal(activeAISurfaces, 60);
assert.equal(structuralN07Messages, 12);
assert.equal(structuralN07Surfaces, 24);
assert.equal(allIdentityMessages, 42);
assert.equal(allIdentitySurfaces, 84);
assert.equal(allIdentityMessages - activeAIMessages, 12, 'the N07 structural layer adds 12 logical directed routes');
assert.equal(allIdentitySurfaces - activeAISurfaces, 24, 'the N07 structural layer adds 24 endpoint surfaces');
assert.match(serverSource, /topologyState:'LOGICAL_UNVERIFIED'/, 'logical channel counts must not claim live endpoint proof');

assert.deepEqual([...N07_PUBLIC_STRUCTURAL_CAPABILITIES], ['mesh.ping']);
assert.equal(
  canonicalOrderedJson([
    ['protocol', 'soul-mesh/1'],
    ['payload', { from: 'N01', scope: 'STRUCTURAL_CONTROL_PLANE', channel: 'N01.OUT.N07' }],
  ]),
  '{"protocol":"soul-mesh/1","payload":{"channel":"N01.OUT.N07","from":"N01","scope":"STRUCTURAL_CONTROL_PLANE"}}',
  'outer Mesh fields retain Go struct order while nested payload keys are canonical',
);
assert.equal(
  canonicalOrderedJson([['payload', { z: [{ y: 2, x: 1 }], a: 0, '10': 'ten', '2': 'two' }]]),
  '{"payload":{"10":"ten","2":"two","a":0,"z":[{"x":1,"y":2}]}}',
  'nested keys sort lexicographically, including numeric-looking keys, without changing array order',
);
assert.match(relaySource, /canonicalOrderedJson\(\[/);
assert.match(relaySource, /\['payload', message\.payload \?\? null\]/);
assert.match(relaySource, /\['meta', message\.meta \?\? null\]/);
assert.equal(isPublicN07StructuralCapability('mesh.ping'), true);
assert.equal(isPublicN07StructuralCapability('sara.cycle@1.0.0'), false);
assert.equal(isPublicN07StructuralCapability('neural.forward@1.0.0'), false);
assert.match(peerClientSource, /ACTIVE_PEERS:Exclude<NucleusId,'N01'\|'N07'>\[\]=\['N02','N03','N04','N05','N06'\]/);
assert.match(peerClientSource, /STRUCTURAL_PEERS:Extract<NucleusId,'N07'>\[\]=\['N07'\]/);
assert.match(peerClientSource, /N07_STRUCTURAL_CAPABILITIES\.has\(capability\.trim\(\)\)/);
assert.match(relaySource, /isPublicN07StructuralCapability\(message\?\.capability\)/);
const correlationCheckIndex = relaySource.indexOf('if (body.correlationId !== message.correlationId)');
const responseHmacCheckIndex = relaySource.indexOf('verifyN07Response(body)', correlationCheckIndex);
const responseStatusCheckIndex = relaySource.indexOf('if (!response.ok && body.kind !== \'error\')', responseHmacCheckIndex);
assert.ok(correlationCheckIndex >= 0 && responseHmacCheckIndex > correlationCheckIndex && responseStatusCheckIndex > responseHmacCheckIndex,
  'N01→N07 relay must verify correlation and HMAC before interpreting HTTP error status');

console.log(`SOUL_MESH_CONTRACT: ok=true local=N01 version=${EXPECTED}`);
console.log(`SOUL_MESH_TOPOLOGY: ok=true operationalAIRequests=${activeAIMessages} operationalAISurfaces=${activeAISurfaces} structuralN07Requests=${structuralN07Messages} structuralN07Surfaces=${structuralN07Surfaces} totalIdentityRequests=${allIdentityMessages} totalEndpointSurfaces=${allIdentitySurfaces} liveE2E=unproven`);
console.log('N07 anonymous relay policy: mesh.ping only; capability execution requires a separately authenticated commissioning path.');
