import { readFile } from 'node:fs/promises';
import { createNeoCortex } from './soul-neocortex.mjs';

const topology = JSON.parse(await readFile(new URL('../config/soul-neocortex-topology.json', import.meta.url), 'utf8'));
const owners = {
  'conversation.chat': 'N02',
  'neural.forward': 'N07',
  'neural.learn': 'N07',
  'audio.transcribe': 'N03',
  'document.analyze': 'N04',
  'orchestration.plan': 'N05',
  'cognitive.synthesize': 'N06',
};
const resolveOwner = (capability) => owners[capability] || null;
const forward = async (target, message) => ({ ok: true, target, echoedCapability: message.capability, correlationId: message.correlationId });
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

console.log(JSON.stringify({ ok: true, topology, decision, snapshot }, null, 2));
