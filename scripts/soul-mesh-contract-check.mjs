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
const runtimePath = resolve(process.cwd(), 'src/core/mesh/SoulMeshRuntime.ts');
const externalFabricPath = resolve(process.cwd(), 'src/core/fusion/N01ExternalCapabilityFabric.ts');
const externalFabricTestPath = resolve(process.cwd(), 'src/core/fusion/N01ExternalCapabilityFabric.test.ts');
const realProcessE2EPath = resolve(process.cwd(), 'scripts/n01-n04-real-process-e2e.mjs');
const realProcessE2EWorkflowPath = resolve(process.cwd(), '.github/workflows/n01-n04-real-process-e2e.yml');
const externalManifestPath = resolve(process.cwd(), 'integrations/soul-25-augmentation.json');
const envelopeSource = await readFile(localEnvelopeSource, 'utf8');
const serverSource = await readFile(localServerSource, 'utf8');
const relaySource = await readFile(relaySourcePath, 'utf8');
const peerClientSource = await readFile(peerClientPath, 'utf8');
const runtimeSource = await readFile(runtimePath, 'utf8');
const externalFabricSource = await readFile(externalFabricPath, 'utf8');
const externalFabricTestSource = await readFile(externalFabricTestPath, 'utf8');
const realProcessE2ESource = await readFile(realProcessE2EPath, 'utf8');
const realProcessE2EWorkflowSource = await readFile(realProcessE2EWorkflowPath, 'utf8');
const externalManifest = JSON.parse(await readFile(externalManifestPath, 'utf8'));

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
assert.match(serverSource, /directionalChannels:counts\.totalEndpointSurfaces,directedRoutes:counts\.totalLogicalDirectedRoutes,endpointSurfaces:counts\.totalEndpointSurfaces,topologyCounts:counts/,
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

assert.deepEqual([...N07_PUBLIC_STRUCTURAL_CAPABILITIES], ['mesh.ping', 'external.federation.describe@1.0.0', 'external.federation.execute@1.0.0']);
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
assert.match(relaySource, /SOUL_MESH_N01_HOST:\s*'127\.0\.0\.1'/,
  'N01 internal Mesh child must bind loopback only; the public wrapper owns the external listener');
assert.match(relaySource, /\['payload', message\.payload \?\? null\]/);
assert.match(relaySource, /\['meta', message\.meta \?\? null\]/);
assert.match(relaySource, /async function registerWithN07\(\) \{/,
  'N01 must retain its authenticated registration function for N07');
assert.match(relaySource, /capability: 'mesh\.register@1\.0\.0'/,
  'N01 registration must use the canonical mesh.register capability');
assert.match(relaySource, /endpoint: N01_ENDPOINT/,
  'N01 registration must advertise the configured public Mesh endpoint');
assert.match(relaySource, /server\.listen\(publicPort, host, \(\) => \{[\s\S]*?registerWithN07\(\)/,
  'N01 startup must attempt registration with N07 after the ingress listener starts');
assert.equal(isPublicN07StructuralCapability('mesh.ping'), true);
assert.equal(isPublicN07StructuralCapability('external.federation.describe@1.0.0'), true);
assert.equal(isPublicN07StructuralCapability('external.federation.execute@1.0.0'), true);
assert.equal(isPublicN07StructuralCapability('sara.cycle@1.0.0'), false);
assert.equal(isPublicN07StructuralCapability('neural.forward@1.0.0'), false);
assert.equal(isPublicN07StructuralCapability('mesh.supergpu.execute@1.0.0'), false);
assert.match(peerClientSource, /ACTIVE_PEERS:Exclude<NucleusId,'N01'\|'N07'>\[\]=\['N02','N03','N04','N05','N06'\]/);
assert.match(peerClientSource, /STRUCTURAL_PEERS:Extract<NucleusId,'N07'>\[\]=\['N07'\]/);
assert.match(peerClientSource, /N07_STRUCTURAL_CAPABILITIES\.has\(capability\.trim\(\)\)/);
assert.match(peerClientSource, /\/api\/soul-mesh\/relay/);
assert.doesNotMatch(peerClientSource, /VITE_SOUL_MESH_TOKEN/);
assert.doesNotMatch(peerClientSource, /VITE_SOUL_MESH_N0[2-7]_URL/);
assert.doesNotMatch(peerClientSource, /x-soul-mesh-hmac/);
assert.match(peerClientSource, /setSoulMeshSessionAccessTokenProvider/);
assert.match(relaySource, /async function requireBrowserAuthentication/);
assert.match(relaySource, /function browserOriginAllowed/);
assert.match(relaySource, /function applyBrowserCors/);
assert.match(relaySource, /req.method === 'OPTIONS'/);
assert.match(relaySource, /access-control-allow-headers/);
assert.match(relaySource, /SOUL_MESH_BROWSER_ALLOWED_ORIGINS/);
assert.match(relaySource, /SOUL_MESH_INTERNAL_RELAY_TOKEN/);
assert.match(relaySource, /SOUL_MESH_BROWSER_SUPERGPU_ALLOWED_USER_IDS/);
assert.match(relaySource, /Buffer\.byteLength\(SECRET, 'utf8'\) < 32/);
assert.match(relaySource, /browserRoutePath === '\/api\/soul-mesh\/supergpu'/);
assert.match(relaySource, /SUPERGPU_VALUES_INVALID/);
assert.match(peerClientSource, /\/api\/soul-mesh\/supergpu/);
assert.match(realProcessE2ESource, /N01_SUPERGPU_BROWSER_AUTH_BOUNDARY_FAILED/);
assert.match(serverSource, /\/mesh\/browser-relay/);
assert.match(serverSource, /INTERNAL_RELAY_UNAUTHORIZED/);
assert.match(serverSource, /MESH_HMAC_SECRET_NOT_CONFIGURED/);
assert.match(serverSource, /function authenticatePeerRegistration\(req, nucleus\)/);
assert.match(serverSource, /SOUL_MESH_.*_REGISTRATION_TOKEN/);
assert.match(serverSource, /crypto\.timingSafeEqual/);
assert.match(serverSource, /MESH_REGISTRATION_CREDENTIAL_NOT_CONFIGURED/);
assert.match(serverSource, /MESH_REGISTRATION_AUTH_REQUIRED/);
assert.match(serverSource, /MESH_REGISTRATION_AUTH_INVALID/);
assert.match(realProcessE2ESource, /N01_PEER_REGISTRATION_AUTH_BOUNDARY_PASS/);
assert.match(realProcessE2ESource, /N01_PEER_REGISTRATION_UNAUTHENTICATED_ACCEPTED/);
assert.match(realProcessE2ESource, /N01_PEER_REGISTRATION_CROSS_IDENTITY_ACCEPTED/);
assert.match(realProcessE2ESource, /scripts\/soul-mesh-server-entry\.mjs/);
assert.match(realProcessE2ESource, /Registration credentials are needed only by N01 and the test harness/);
assert.match(realProcessE2ESource, /function runN04Client[\s\S]*?const driverEnv = \{[\s\S]*?SOUL_MESH_N0\[2-7\]_REGISTRATION_TOKEN[\s\S]*?delete driverEnv\[key\][\s\S]*?env: driverEnv/);
const n01BuildIndex = realProcessE2EWorkflowSource.indexOf('name: Build N01 web runtime');
const n04BuildIndex = realProcessE2EWorkflowSource.indexOf('name: Build N04 production runtime');
const secretGenerationIndex = realProcessE2EWorkflowSource.indexOf('name: Generate ephemeral E2E-only Mesh authentication and app secrets');
const e2eIndex = realProcessE2EWorkflowSource.indexOf('name: Bidirectional N01↔N04 real-process HTTP/HMAC E2E');
assert.ok(n01BuildIndex >= 0 && n04BuildIndex > n01BuildIndex && secretGenerationIndex > n04BuildIndex && e2eIndex > secretGenerationIndex,
  'ephemeral Mesh secrets must be generated after both builds and immediately before runtime E2E');
assert.match(realProcessE2EWorkflowSource, /echo "SOUL_MESH_N04_REGISTRATION_TOKEN=\$registration_n04"/);
assert.match(realProcessE2EWorkflowSource, /echo "SOUL_MESH_N05_REGISTRATION_TOKEN=\$registration_n05"/);
assert.match(realProcessE2EWorkflowSource, /}\s*>> "\$GITHUB_ENV"/);
assert.doesNotMatch(realProcessE2EWorkflowSource, /GITHUB_OUTPUT|steps\.mesh-secrets\.outputs/);
assert.match(realProcessE2ESource, /function runN04Client[\s\S]*?delete driverEnv\[key\][\s\S]*?env: driverEnv/);
assert.match(realProcessE2ESource, /N01_BROWSER_RELAY_AUTH_BOUNDARY_PASS/);
assert.match(realProcessE2ESource, /SOUL_MESH_BROWSER_SESSION_REQUIRED/);
assert.match(relaySource, /isPublicN07StructuralCapability\(capability\)/);
const correlationCheckIndex = relaySource.indexOf('if (body.correlationId !== message.correlationId)');
const responseHmacCheckIndex = relaySource.indexOf('verifyN07Response(body)', correlationCheckIndex);
const responseStatusCheckIndex = relaySource.indexOf('if (!response.ok && body.kind !== \'error\')', responseHmacCheckIndex);
assert.ok(correlationCheckIndex >= 0 && responseHmacCheckIndex > correlationCheckIndex && responseStatusCheckIndex > responseHmacCheckIndex,
  'N01→N07 relay must verify correlation and HMAC before interpreting HTTP error status');

const manifestProviders = externalManifest.external_providers;
assert.equal(externalManifest.external_provider_count, 25, 'N01 canonical manifest must declare 25 public sources');
assert.equal(manifestProviders.length, 25, 'N01 manifest source count must match its declaration');
assert.equal(new Set(manifestProviders.map((provider) => provider.id)).size, 25, 'N01 manifest provider IDs must be unique');
assert.equal(externalManifest.soul_peer_count, 9, 'N01 must preserve the nine native SOUL peers');
assert.equal(externalManifest.soul_peers.length, 9, 'N01 native peer identity list must remain intact');
assert.equal(externalManifest.native_authority, 'preserved', 'external adapters must not replace native capability ownership');

const adapterStateCounts = { REGISTERED: 0, EXPANSION_ONLY: 0, UNREGISTERED: 0 };
for (const provider of manifestProviders) {
  assert.match(provider.source, /^https:\/\/github\.com\//, `${provider.id} must use its public source URL`);
  assert.match(provider.revision, /^[0-9a-f]{40}$/i, `${provider.id} must be pinned to an exact Git revision`);
  assert.ok(provider.owner && provider.targets?.length, `${provider.id} must keep native ownership and targets`);
  assert.equal(provider.runtime_state, 'PROJECTED', `${provider.id} cannot be declared runtime-ready without provider E2E`);
  assert.equal(provider.requires_adapter, true, `${provider.id} must require an explicit adapter`);
  assert.equal(provider.execution_boundary, `native-owner:${provider.owner}`, `${provider.id} must retain its native-owner boundary`);
  assert.ok(Object.hasOwn(adapterStateCounts, provider.runtime_adapter_status), `${provider.id} has unknown adapter status`);
  adapterStateCounts[provider.runtime_adapter_status] += 1;
  assert.ok(Array.isArray(provider.adapter_operations), `${provider.id} must declare an operation list`);
  if (provider.runtime_adapter_status === 'REGISTERED') {
    assert.ok(provider.adapter_operations.length > 0, `${provider.id} is registered but has no operations`);
  } else {
    assert.equal(provider.runtime_state, 'PROJECTED', `${provider.id} is not executable yet`);
  }
}
assert.deepEqual(adapterStateCounts, { REGISTERED: 16, EXPANSION_ONLY: 1, UNREGISTERED: 8 });
assert.match(externalFabricSource, /runtimeAdapterStatus/);
assert.match(externalFabricSource, /adapterOperations/);
assert.match(externalFabricTestSource, /adapter registration drift/);
assert.match(externalFabricTestSource, /runtimeAdapterStatus/);
assert.match(runtimeSource, /external\.capability\.resolve@1\.0\.0/);
assert.match(runtimeSource, /external\.capability\.fabric\.describe@1\.0\.0/);
assert.match(runtimeSource, /provider\.runtimeAdapterStatus !== 'REGISTERED'/);
assert.match(runtimeSource, /provider\.adapterOperations\.includes\(operation\)/);
assert.match(runtimeSource, /provider_revision: provider\.revision/);
assert.match(runtimeSource, /external_result_json/);
assert.match(runtimeSource, /externalResult\.state !== 'PASS'/);
assert.match(serverSource, /external\.capability\.resolve@1\.0\.0/);
assert.match(serverSource, /external\.capability\.fabric\.describe@1\.0\.0/);
assert.match(serverSource, /runtime_adapter_status !== 'REGISTERED'/);
assert.match(serverSource, /adapter_operations\.includes\(operation\)/);
assert.match(serverSource, /provider_revision: provider\.revision/);
assert.match(serverSource, /result\.state !== 'PASS'/);

console.log(`SOUL_MESH_CONTRACT: ok=true local=N01 version=${EXPECTED}`);
console.log(`SOUL_MESH_TOPOLOGY: ok=true operationalAIRequests=${activeAIMessages} operationalAISurfaces=${activeAISurfaces} structuralN07Requests=${structuralN07Messages} structuralN07Surfaces=${structuralN07Surfaces} totalIdentityRequests=${allIdentityMessages} totalEndpointSurfaces=${allIdentitySurfaces} liveE2E=unproven`);
console.log('N07 relay policy: mesh.ping plus explicit external federation operations only; server HMAC relay, native-owner boundary, provider opt-in and fail-closed execution remain required.');
