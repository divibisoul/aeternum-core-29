import { readFile } from 'node:fs/promises';
import { SoulNeuralGraph } from '../src/soul-fusion/SoulNeuralGraph.ts';
import { NeoCortexPrefrontal } from '../src/soul-fusion/NeoCortexPrefrontal.ts';
import { createDefaultSuperGPU } from '../src/soul-fusion/SoulSuperGPU.ts';

const topology = JSON.parse(await readFile(new URL('../config/soul-neocortex-topology.json', import.meta.url), 'utf8'));
const graph = new SoulNeuralGraph();

for (const branch of topology.branches) {
  graph.registerNode({
    nucleus: branch.nucleus,
    capabilities: [],
    salience: 1,
    load: 0,
    available: true,
  });
}

const gpu = createDefaultSuperGPU();
const cortex = new NeoCortexPrefrontal(graph, gpu);
cortex.addGoal({ id: 'bootstrap', description: 'validate distributed executive topology', priority: 1 });
const decision = cortex.decide('bootstrap');
const snapshot = cortex.describe();

if (topology.branches.length !== 6) throw new Error('NEOCORTEX_REQUIRES_SIX_NUCLEI');
if (topology.executiveFunctions.length < 8) throw new Error('NEOCORTEX_EXECUTIVE_FUNCTIONS_INCOMPLETE');
if (topology.individualNucleiPreserved !== true) throw new Error('NUCLEUS_INDEPENDENCE_MUST_BE_PRESERVED');
if (snapshot.activeNuclei !== 6) throw new Error('NEOCORTEX_NODE_REGISTRATION_INCOMPLETE');
if (decision.inhibited) throw new Error('NEOCORTEX_BOOTSTRAP_ROUTE_INHIBITED');

console.log(JSON.stringify({ ok: true, topology, decision, snapshot }, null, 2));
