import { readFile } from 'node:fs/promises';
import { createNeoCortex } from './soul-neocortex.mjs';

const topology = JSON.parse(await readFile(new URL('../config/soul-neocortex-topology.json', import.meta.url), 'utf8'));
const owners = {
  'conversation.chat': 'N02',
  'audio.transcribe': 'N03',
  'document.analyze': 'N04',
  'orchestration.plan': 'N05',
  'cognitive.synthesize': 'N06',
};
const resolveOwner = (capability) => owners[capability] || null;
const forward = async (target, message) => ({ ok: true, target, echoedCapability: message.capability, correlationId: message.correlationId });

const failClosedCortex = createNeoCortex({ resolveOwner, forward });
failClosedCortex.addGoal({
  id: 'unverified-remote',
  description: 'remote nodes must not be selected before a live capability is observed',
  priority: 1,
  requiredCapabilities: ['cognitive.synthesize'],
});
const blockedRemote = failClosedCortex.decide('unverified-remote');
if (!blockedRemote.inhibited || blockedRemote.selectedNucleus !== undefined) {
  throw new Error('NEOCORTEX_UNVERIFIED_REMOTE_MUST_FAIL_CLOSED');
}
const sharedRuntime = {
  resolve: () => ({ taskId: 'fixture', capability: 'cognitive.synthesize', owner: 'N06', backend: 'REMOTE_MESH' }),
  execute: async () => ({ state: 'fixture-only' }),
  executeParallel: async () => [],
  describe: () => ({ sharedRuntimeMarker: true }),
};
const injectedCortex = createNeoCortex({ resolveOwner, forward, superGPU: sharedRuntime });
if (injectedCortex.describe().superGPU?.sharedRuntimeMarker !== true || injectedCortex.describe().sharedSuperGPU !== true) {
  throw new Error('NEOCORTEX_MUST_USE_SHARED_SUPERGPU_INSTANCE');
}
const cortex = createNeoCortex({ resolveOwner, forward });

for (const branch of topology.branches) cortex.registerNode({ nucleus: branch.nucleus, capabilities: [], salience: 1, load: 0, available: true });
for (const [capability, nucleus] of Object.entries(owners)) cortex.registerNode({ nucleus, capabilities: [capability], salience: 1, load: 0, available: true });

cortex.addGoal({ id: 'bootstrap', description: 'validate distributed executive topology', priority: 1, requiredCapabilities: ['cognitive.synthesize'] });
const decision = cortex.decide('bootstrap');
const snapshot = cortex.describe();

if (topology.branches.length !== 7) throw new Error('NEOCORTEX_REQUIRES_SEVEN_NUCLEI');
if (topology.executiveFunctions.length < 8) throw new Error('NEOCORTEX_EXECUTIVE_FUNCTIONS_INCOMPLETE');
if (topology.individualNucleiPreserved !== true) throw new Error('NUCLEUS_INDEPENDENCE_MUST_BE_PRESERVED');
if (snapshot.nuclei.length !== 7) throw new Error('NEOCORTEX_NODE_REGISTRATION_INCOMPLETE');
if (decision.inhibited || decision.selectedNucleus !== 'N06') throw new Error('NEOCORTEX_CAPABILITY_ROUTING_FAILED');
if (snapshot.superpowersAgent?.id !== 'superpowers.cortex-orbital-supergpu') throw new Error('SUPERPOWERS_CORTEX_AGENT_MISSING');
if (snapshot.superpowersAgent?.noFakeRuntimeSuccess !== true) throw new Error('SUPERPOWERS_CORTEX_AGENT_POLICY_INVALID');

console.log(JSON.stringify({ ok: true, topology, decision, snapshot }, null, 2));
